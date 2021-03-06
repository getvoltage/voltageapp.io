import { defineComponent, PropType, computed, ref } from "@vue/composition-api";
import { macaroonStore } from "~/store";
import { VProgressCircular } from "vuetify/lib";
import type { Node } from "~/types/apiResponse";
import PodcastChart from "~/components/PodcastChart";

export default defineComponent({
  props: {
    node: {
      type: Object as PropType<Node>,
      required: true,
    },
    macaroon: {
      type: Object as PropType<ReturnType<typeof macaroonStore.macaroonState>>,
      required: true,
    },
    meta: {
      type: Object as PropType<ReturnType<typeof macaroonStore.findNodeMeta>>,
      required: true,
    },
  },
  setup: (props) => {
    const invoices = ref<Array<Record<string, any>> | null>(null);
    const loading = ref(false);
    const error = ref("");

    async function loadData() {
      if (!props.meta) return;
      error.value = "";
      loading.value = true;
      try {
        const res = await fetch(
          `https://${props.meta?.endpoint}:8080/v1/invoices?num_max_invoices=100000&reversed=true`,
          {
            method: "GET",
            headers: new Headers({
              "Grpc-Metadata-macaroon": props.macaroon.macaroonHex,
              "Content-Type": "application/json",
            }),
          }
        );
        const js = await res.json();
        // see response data shape at https://api.lightning.community/?javascript#v1-invoices
        invoices.value = js.invoices.filter((invoice: any) => {
          const isValid = invoice?.settled && invoice?.is_keysend
          return isValid
        })
      } catch (e) {
        error.value =
          "An error occured communicating with your node. Please try again later";
      } finally {
        loading.value = false;
      }
    }
    loadData();


    // returns the epoch time bin that 'time' falls into given a start time, a count backwards interval and number of bins to create
    // returns null if the given time is before the span of the interval
    function getBin({
      time,
      interval,
      bins,
      start,
    }: {
      time: number;
      interval: number;
      bins: number;
      start: number;
    }): null | number {
      if (bins === 0) return null;
      if (time >= start - interval) return start;
      return getBin({
        time,
        interval,
        bins: bins - 1,
        start: start - interval,
      });
    }

    function makeBins({
      interval,
      bins,
      start,
    }: {
      interval: number;
      bins: number;
      start: number;
    }): number[] {
      let output = [];
      let cur = start;
      for (let i = 0; i < bins; i += 1) {
        output.push(cur);
        cur -= interval;
      }
      return output;
    }

    function binToStr(bin: number): string {
      const date = new Date(bin * 1000);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    // current epoch time
    const now = new Date().getTime() / 1000;
    const secondsPerDay = 86400;
    const podcastData = computed(() => {
      if (!invoices.value) return null;
      const data = new Map<string, { x: string; y: number }>();
      const bins = makeBins({
        interval: secondsPerDay,
        bins: 14,
        start: now,
      });
      for (const bin of bins) {
        const key = binToStr(bin);
        data.set(key, { x: key, y: 0 });
      }
      for (const invoice of invoices.value) {
        const acceptTime = invoice?.settle_date;
        if (!acceptTime) continue;
        const bin = getBin({
          time: +acceptTime,
          interval: secondsPerDay,
          bins: 14,
          start: now,
        });

        // if the current htlc falls outside time range, skip
        if (!bin) continue;

        const dateKey = binToStr(bin);
        const prevAmt = data.get(dateKey)?.y;

        const newAmt = +invoice.amt_paid_sat + (prevAmt || 0);

        data.set(dateKey, { x: dateKey, y: newAmt });
      }
      // chop off initial zeros
      let firstNonZeroEncountered = false;
      const output = Array.from(data.values())
        .reverse()
        .filter((elem) => {
          if (firstNonZeroEncountered) return true;
          if (elem.y > 0) {
            firstNonZeroEncountered = true;
            return true;
          }
          return false;
        });

      return output.length > 0 ? output : null;
    });


    return () => {
      if (loading.value) {
        return <VProgressCircular indeterminate class="mx-auto" />;
      } else if (podcastData.value) {
        return (
          <div>
            {/*<JsonTable data={() => podcastData.value?.tableData as JsonData} />*/}
            {podcastData.value && (
              <PodcastChart chartData={podcastData.value} />
            )}
          </div>
        );
      } else if (error.value) {
        return <div class="ma-3 text-h6">{error.value}</div>;
      } else {
        return (
          <div class="ma-3 text-h6">
            No Podcast stream data found for this node
          </div>
        );
      }
    };
  },
});
