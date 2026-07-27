import { onRequest as __api_d1_admin_deploy_ts_onRequest } from "/Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/functions/api/d1-admin-deploy.ts"
import { onRequest as __api_d1_app_data_deploy_ts_onRequest } from "/Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/functions/api/d1-app-data-deploy.ts"
import { onRequest as __api_d1_audio_metadata_ts_onRequest } from "/Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/functions/api/d1-audio-metadata.ts"
import { onRequest as __api_d1_transaction_deploy_ts_onRequest } from "/Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/functions/api/d1-transaction-deploy.ts"
import { onRequest as __api_dynamic_data_ts_onRequest } from "/Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/functions/api/dynamic-data.ts"
import { onRequest as __api_vocabulary_ts_onRequest } from "/Users/thawzinoo/.gemini/antigravity-ide/scratch/sirithai/functions/api/vocabulary.ts"

export const routes = [
    {
      routePath: "/api/d1-admin-deploy",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_d1_admin_deploy_ts_onRequest],
    },
  {
      routePath: "/api/d1-app-data-deploy",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_d1_app_data_deploy_ts_onRequest],
    },
  {
      routePath: "/api/d1-audio-metadata",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_d1_audio_metadata_ts_onRequest],
    },
  {
      routePath: "/api/d1-transaction-deploy",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_d1_transaction_deploy_ts_onRequest],
    },
  {
      routePath: "/api/dynamic-data",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_dynamic_data_ts_onRequest],
    },
  {
      routePath: "/api/vocabulary",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_vocabulary_ts_onRequest],
    },
  ]