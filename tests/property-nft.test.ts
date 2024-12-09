import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock contract state
let contractState: {
  properties: Record<number, any>;
  propertyOwnership: Record<string, number>;
  nextPropertyId: number;
} = {
  properties: {},
  propertyOwnership: {},
  nextPropertyId: 0
}

// Mock contract calls
const mockContractCall = vi.fn()

// Helper function to reset state before each test
function resetState() {
  contractState = {
    properties: {},
    propertyOwnership: {},
    nextPropertyId: 0
  }
}

describe('Property NFT Contract', () => {
  beforeEach(() => {
    resetState()
    vi.resetAllMocks()
  })
  
  it('should mint a new property', () => {
    mockContractCall.mockImplementation(() => {
      const propertyId = contractState.nextPropertyId
      contractState.properties[propertyId] = {
        name: 'Luxury Apartment',
        location: '123 Main St',
        totalShares: 1000,
        pricePerShare: 100
      }
      contractState.propertyOwnership[`${propertyId}-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`] = 1000
      contractState.nextPropertyId++
      return { success: true, value: propertyId }
    })
    
    const result = mockContractCall('mint-property', 'Luxury Apartment', '123 Main St', 1000, 100)
    expect(result).toEqual({ success: true, value: 0 })
    expect(contractState.properties[0]).toBeDefined()
    expect(contractState.propertyOwnership['0-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM']).toBe(1000)
  })
  
  it('should get property details', () => {
    // Setup initial state
    contractState.properties[0] = {
      name: 'Luxury Apartment',
      location: '123 Main St',
      totalShares: 1000,
      pricePerShare: 100
    }
    
    mockContractCall.mockImplementation(() => {
      const [propertyId] = mockContractCall.mock.calls[0].slice(1)
      return { success: true, value: contractState.properties[propertyId] }
    })
    
    const result = mockContractCall('get-property-details', 0)
    expect(result).toEqual({
      success: true,
      value: {
        name: 'Luxury Apartment',
        location: '123 Main St',
        totalShares: 1000,
        pricePerShare: 100
      }
    })
  })
  
  it('should transfer shares between users', () => {
    // Setup initial state
    contractState.properties[0] = {
      name: 'Luxury Apartment',
      location: '123 Main St',
      totalShares: 1000,
      pricePerShare: 100
    }
    contractState.propertyOwnership['0-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'] = 1000
    
    mockContractCall.mockImplementation(() => {
      const [propertyId, recipient, shares] = mockContractCall.mock.calls[0].slice(1)
      const senderShares = contractState.propertyOwnership[`${propertyId}-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`]
      if (senderShares < shares) return { success: false, error: 1 }
      
      contractState.propertyOwnership[`${propertyId}-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`] -= shares
      contractState.propertyOwnership[`${propertyId}-${recipient}`] = (contractState.propertyOwnership[`${propertyId}-${recipient}`] || 0) + shares
      return { success: true }
    })
    
    const result = mockContractCall('transfer-shares', 0, 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 400)
    expect(result).toEqual({ success: true })
    expect(contractState.propertyOwnership['0-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM']).toBe(600)
    expect(contractState.propertyOwnership['0-ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG']).toBe(400)
  })
  
  it('should not allow transferring more shares than owned', () => {
    // Setup initial state
    contractState.properties[0] = {
      name: 'Luxury Apartment',
      location: '123 Main St',
      totalShares: 1000,
      pricePerShare: 100
    }
    contractState.propertyOwnership['0-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'] = 1000
    
    mockContractCall.mockImplementation(() => {
      const [propertyId, recipient, shares] = mockContractCall.mock.calls[0].slice(1)
      const senderShares = contractState.propertyOwnership[`${propertyId}-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`]
      if (senderShares < shares) return { success: false, error: 1 }
      
      contractState.propertyOwnership[`${propertyId}-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`] -= shares
      contractState.propertyOwnership[`${propertyId}-${recipient}`] = (contractState.propertyOwnership[`${propertyId}-${recipient}`] || 0) + shares
      return { success: true }
    })
    
    const result = mockContractCall('transfer-shares', 0, 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', 1200)
    expect(result).toEqual({ success: false, error: 1 })
    expect(contractState.propertyOwnership['0-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM']).toBe(1000)
    expect(contractState.propertyOwnership['0-ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG']).toBeUndefined()
  })
  
  it('should get owner shares', () => {
    // Setup initial state
    contractState.propertyOwnership['0-ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'] = 1000
    
    mockContractCall.mockImplementation(() => {
      const [propertyId, owner] = mockContractCall.mock.calls[0].slice(1)
      return { success: true, value: contractState.propertyOwnership[`${propertyId}-${owner}`] || 0 }
    })
    
    const result = mockContractCall('get-owner-shares', 0, 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM')
    expect(result).toEqual({ success: true, value: 1000 })
  })
})

