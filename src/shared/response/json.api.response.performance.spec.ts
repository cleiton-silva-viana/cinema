import { JsonApiResponse } from './json.api.response'
import { performance } from 'perf_hooks'

describe('JsonApiResponse Performance', () => {
  it('deve lidar eficientemente com grandes volumes de recursos incluídos', () => {
    // Arrange
    const response = new JsonApiResponse()
    const mainResource = { id: '1', type: 'articles' }

    const includedResources = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 100}`,
      type: 'comments',
      attributes: { text: `Comment ${i}` },
    }))

    // Act
    const startTime = performance.now()

    response.data(mainResource).included(includedResources)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Assert
    // O tempo exato dependerá do hardware, vou estabelecer um limite razoável
    expect(executionTime).toBeLessThan(500) // menos de 500ms

    const json = response.toJSON()
    expect(json.included).toHaveLength(1000)
  })

  it('deve lidar eficientemente com grandes volumes de recursos em data array', () => {
    // Arrange
    const response = new JsonApiResponse()

    const resources = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'articles',
      attributes: { title: `Article ${i}` },
    }))

    // Act
    const startTime = performance.now()

    response.datas(resources)

    const endTime = performance.now()
    const executionTime = endTime - startTime

    // Assert
    expect(executionTime).toBeLessThan(500) // menos de 500ms
    const json = response.toJSON()
    expect(json.data as any[]).toHaveLength(1000)
  })
})
