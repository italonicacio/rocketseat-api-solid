import { expect, describe, it, beforeEach } from 'vitest'
import { InMemoryCheckIns } from '@/repository/in-memory/in-memory-check-ins-repository'
import { GetUserMetricsUseCase } from './get-user-metrics'

let checkInsRepository: InMemoryCheckIns
let sut: GetUserMetricsUseCase

describe('Get User Metrics Use Case', () => {
  beforeEach(async () => {
    checkInsRepository = new InMemoryCheckIns()
    sut = new GetUserMetricsUseCase(checkInsRepository)
  })

  it('should be able to get check-ins count from metrics', async () => {
    await checkInsRepository.create({
      user_id: 'user-id-01',
      gym_id: 'gym-id-01',
    })

    await checkInsRepository.create({
      user_id: 'user-id-01',
      gym_id: 'gym-id-02',
    })

    const { checkInsCount } = await sut.execute({
      userId: 'user-id-01',
    })

    expect(checkInsCount).toEqual(2)
  })
})
