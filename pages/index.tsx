import { defineComponent, computed } from "@vue/composition-api";
import { nodeStore, createStore } from "~/store";
import { VContainer, VRow, VCol } from 'vuetify/lib'
import NodeListView from "~/components/NodeListView.vue"
import NodeLandingCard from "~/components/NodeLandingCard"
import PodcastLandingCard from "~/components/PodcastLanding"

export default defineComponent({
  setup: () => {
    const displayContent = computed(() => {
      //TEMP
      return <PodcastLandingCard />
      if (nodeStore.IDNames.length) {
        return <NodeListView />
      } else if (createStore.referralCode) {
        return <PodcastLandingCard />
      } else {
        return <NodeLandingCard />
      }
    })

    return () => {
      return <VContainer>
        { /*<v-container color="primary">
          <landing-dialog />
        </v-container>
           */ }
        <VRow justify="center" align="center" no-gutters="no-gutters">
          <VCol cols="12" md="10" lg="8">
            {displayContent.value}
          </VCol>
        </VRow>
      </VContainer>
    };
  },
});
