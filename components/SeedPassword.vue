<template lang="pug">
div
  div.text-center.warning--text.display-1(style='padding: 20px;')
    | Create a password for your node
  div(style='padding: 20px;')
    v-form(v-model='valid' @submit.prevent='getMacaroon' ref='form')
      v-text-field(
        v-model='password'
        :rules='[required]'
        label='Password'
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        required
        @click:append='showPassword = !showPassword'
      )
      v-text-field(
        v-model='confirmPassword'
        :rules='[char8, matchPassword, required]'
        :type="showPassword ? 'text' : 'password'"
        label='Confirm New Password'
        :error-messages='error'
        required
      )
      br
      div.text-center.warning--text.mb-6
        | Write this password down too. This is the password to your node and also used for client-side macaroon encryption. Losing this password means losing access to macaroon backups.
      v-divider.mx-12.mt-6
      br
      div.text-center.warning--text.mb-6
        | This can take up to 30 seconds. Do not close your browser.
      v-btn(type='submit' color='highlight' :disabled='!valid' block :loading='loading').info--text Initialize Node
</template>
<script lang="ts">
import { defineComponent, ref, watch } from "@vue/composition-api";
// @ts-ignore
import { AES, format } from "crypto-js";
import axios from "axios";
import useFormValidation from "~/compositions/useFormValidation";
import useNodeApi from "~/compositions/useNodeApi";
import { lndStore } from "~/store";
import { Node } from "~/types/apiResponse";

export default defineComponent({
  setup(_, context) {
    const loading = ref(false);
    const error = ref("");
    const { updateStatus } = useNodeApi(context.root.$nuxt.context);
    async function getMacaroon() {
      const node = lndStore.currentNode as Node;
      loading.value = true;
      try {
        const res = await axios({
          method: "POST",
          url: `https://${node.api_endpoint}:8080/v1/initwallet`,
          data: {
            wallet_password: btoa(formState.password.value), // b64 encode password string
            cipher_seed_mnemonic: lndStore.cipher_seed_mnemonic,
            stateless_init: true,
          },
        });
        loading.value = false;
        lndStore.MACAROON(res.data.admin_macaroon);
        // check the current nodes macaroon backup is true
        if (node.macaroon_backup) {
          const encrypted = AES.encrypt(
            res.data.admin_macaroon,
            formState.password.value
          ).toString();
          const { postMacaroon } = useNodeApi(context.root.$nuxt.context);
          await postMacaroon(node.node_id, "admin", encrypted);
        }
        updateStatus(node.node_id, "initializing");
        context.emit("next");
      } catch (err) {
        error.value = `${err}`;
      } finally {
        loading.value = false;
      }
    }

    const formState = useFormValidation();

    // clear errors on typing in password field
    watch(formState.password, () => {
      error.value = "";
    });

    return {
      getMacaroon,
      loading,
      error,
      ...formState,
    };
  },
});
</script>
