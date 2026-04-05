import { beforeEach, describe, expect, it } from "vitest"

import {
  getMetrics,
  resetMetrics,
  trackWriteAttempt,
  trackWriteFail,
  trackWriteSuccess,
} from "./metrics"
import { resetActionCenterMetricsStoreCache } from "./metrics/store/get-store"

describe("action center metrics", () => {
  beforeEach(async () => {
    resetActionCenterMetricsStoreCache()
    await resetMetrics()
  })

  it("tracks write metrics through store", async () => {
    await trackWriteAttempt()
    await trackWriteAttempt()
    await trackWriteSuccess()
    await trackWriteFail()

    expect(await getMetrics()).toEqual({
      writesAttempted: 2,
      writesSuccess: 1,
      writesFailed: 1,
    })
  })
})
