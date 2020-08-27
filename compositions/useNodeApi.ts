import { Context } from '@nuxt/types'
import { ref } from '@vue/composition-api'
import { createStore, nodeStore, exportsStore } from '~/store'
import { Node, CreateNode, PopulateNode, NodeExport, NodeNameResponse } from '~/types/apiResponse'
import { Settings, Network, ExportData } from '~/types/api'

export default function useNodeApi ({ $axios, error }: Context) {
  const loading = ref(false)

  async function createNode () {
    loading.value = true
    const node = await $axios.post<CreateNode>(
      '/node/create',
      {
        network: createStore.network,
        purchased_type: createStore.trial ? 'trial' : 'paid'
      }
    )
    createStore.NEW_NODE_ID(node.data?.['node_id'])
    createStore.AUTOFILL_WHITELIST(node.data?.['user_ip'])
    loading.value = false
    return node
  }

  async function populateNode () {
    loading.value = true
    try {
      const node = await $axios.post<PopulateNode>(
        '/node/populate',
        {
          node_id: createStore.newNodeID,
          name: createStore.nodeName,
          settings: createStore.settings
        }
      )
      loading.value = false
      return node
    } catch (e) {
      loading.value = false
      error({ statusCode: 500 })
    } finally {
      loading.value = false
    }
  }

  async function postNode (id:string) {
    loading.value = true
    const node = await $axios.post<Node>('/node', {
      node_id: id
    })
    nodeStore.ADD_NODE(node.data)
    createStore.HYDRATE_SETTINGS(node.data.settings)
    loading.value = false
    return node.data
  }

  async function updateSettings (id: string, backup: boolean, settings: Settings) {
    loading.value = true
    try {
      const res = await $axios.post('/node/settings', {
        node_id: id,
        macaroon_backup: backup,
        settings
      })
      nodeStore.ADD_NODE(res.data)
      loading.value = false
      return res
    } catch (e) {
      loading.value = false
      error({ statusCode: 500 })
    } finally {
      loading.value = false
    }
  }

  async function updateNode (id: string) {
    loading.value = true
    try {
      const res = await $axios.post('/node/update', {
        node_id: id
      })
      return res
    } catch (e) {
      loading.value = false
      error({ statusCode: 500 })
    } finally {
      loading.value = false
    }
  }

  async function updateTls (id: string) {
    loading.value = true
    try {
      const res = await $axios.post('/node/tls_update', {
        node_id: id
      })
      loading.value = false
      return res
    } catch (e) {
      loading.value = false
      error({ statusCode: 500 })
    } finally {
      loading.value = false
    }
  }

  async function startExport (id: string, exportData: ExportData) {
    loading.value = true
    try {
      const res = await $axios.post<NodeExport>('/export', {
        node_id: id,
        type: exportData
      })
      loading.value = false
      exportsStore.ADD_EXPORT(res.data)
      return res
    } catch (e) {
      loading.value = false
      error({ statusCode: 500 })
    } finally {
      loading.value = false
    }
  }

  async function nodeName (node_name: string, network: Network) {
    loading.value = true
    const res = await $axios.post<NodeNameResponse>('/node/name', {
      node_name,
      network
    })
    loading.value = false
    return res
  }

  async function updateStatus(node_id: string, status: string) {
    try {
      console.log(node_id)
      const res = await $axios.post('/node/status', {
        node_id: node_id,
        status: status
      })
      return res
    } catch (e) {
      loading.value = false
      console.log(e)
    } finally {
      loading.value = false
    }
  }

  return {
    createNode,
    populateNode,
    postNode,
    updateNode,
    updateTls,
    updateSettings,
    loading,
    startExport,
    nodeName,
    updateStatus
  }
}
