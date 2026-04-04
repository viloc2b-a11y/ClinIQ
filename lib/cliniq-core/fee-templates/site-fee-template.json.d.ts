import type { SiteFeeTemplateDocument } from "./site-fee-template-types"

declare module "./site-fee-template.json" {
  const doc: SiteFeeTemplateDocument
  export default doc
}
