import { setupCustomMatchers } from '@test/helpers/custom.matchers'

setupCustomMatchers()

beforeAll(() => {
  process.env.TZ = 'UTC'
  jest.setTimeout(10000)
})

beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  jest.clearAllTimers()
})

afterAll(() => {
  // Restaura mocks
  jest.restoreAllMocks()
})
