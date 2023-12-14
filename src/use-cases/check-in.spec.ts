import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest'
import { InMemoryCheckIns } from '@/repository/in-memory/in-memory-check-ins-repository'
import { CheckInUseCase } from './check-in'
import { InMemoryGymsRepository } from '@/repository/in-memory/in-memory-gyms-repository'
import { Decimal } from '@prisma/client/runtime/library'
import { MaxNumberOfCheckInsError } from './errors/max-number-of-check-ins-error'
import { MaxDistanceError } from './errors/max-distance-error'

let checkInsRepository: InMemoryCheckIns
let gymsRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('Check In Use Case', () => {
  beforeEach(async () => {
    checkInsRepository = new InMemoryCheckIns()
    gymsRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymsRepository)

    await gymsRepository.create({
      id: 'gym-id-01',
      title: 'Javascript Gym',
      description: '',
      phone: '',
      latitude: -7.073433,
      longitude: -34.843246,
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to check in', async () => {
    const { checkIn } = await sut.execute({
      userId: 'user-id-01',
      gymId: 'gym-id-01',
      userLatitude: -7.073433,
      userLongitude: -34.843246,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should be able to check in twice in the same day', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0))

    await sut.execute({
      userId: 'user-id-01',
      gymId: 'gym-id-01',
      userLatitude: -7.073433,
      userLongitude: -34.843246,
    })

    await expect(() =>
      sut.execute({
        userId: 'user-id-01',
        gymId: 'gym-id-01',
        userLatitude: -7.073433,
        userLongitude: -34.843246,
      }),
    ).rejects.toBeInstanceOf(MaxNumberOfCheckInsError)
  })

  it('should be able to check in twice but in different days', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0))

    await sut.execute({
      userId: 'user-id-01',
      gymId: 'gym-id-01',
      userLatitude: -7.073433,
      userLongitude: -34.843246,
    })

    vi.setSystemTime(new Date(2022, 0, 21, 8, 0, 0))

    const { checkIn } = await sut.execute({
      userId: 'user-id-01',
      gymId: 'gym-id-01',
      userLatitude: -7.073433,
      userLongitude: -34.843246,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in on distant gym', async () => {
    gymsRepository.items.push({
      id: 'gym-id-02',
      title: 'Javascript Gym',
      description: '',
      phone: '',
      latitude: new Decimal(-7.0742518),
      longitude: new Decimal(-34.8433488),
    })

    await expect(() =>
      sut.execute({
        userId: 'user-id-01',
        gymId: 'gym-id-02',
        userLatitude: -7.073433,
        userLongitude: -34.873246,
      }),
    ).rejects.toBeInstanceOf(MaxDistanceError)
  })
})
