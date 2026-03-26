'use client'

import { useState } from 'react'
import { CountrySelect } from './CountrySelect'
import { StateSelect } from './StateSelect'
import { DistrictSelect } from './DistrictSelect'
import { CollegeSelect } from './CollegeSelect'
import { CollegeNotFoundForm } from './CollegeNotFoundForm'

export interface LocationSelectionState {
  country: string
  state: string
  district: string
  collegeId: string
  collegeName: string
}

interface LocationSelectionProps {
  value: LocationSelectionState
  onChange: (value: LocationSelectionState) => void
  disabled?: boolean
}

export function LocationSelection({ value, onChange, disabled }: LocationSelectionProps) {
  const [showNotFoundForm, setShowNotFoundForm] = useState(false)

  const handleCountryChange = (country: string) => {
    onChange({
      ...value,
      country,
      state: '', // Reset state when country changes
      district: '',
      collegeId: '',
      collegeName: '',
    })
  }

  const handleStateChange = (state: string) => {
    onChange({
      ...value,
      state,
      district: '', // Reset district when state changes
      collegeId: '',
      collegeName: '',
    })
  }

  const handleDistrictChange = (district: string) => {
    onChange({
      ...value,
      district,
      collegeId: '', // Reset college when district changes
      collegeName: '',
    })
  }

  const handleCollegeChange = (collegeId: string, collegeName: string) => {
    onChange({
      ...value,
      collegeId,
      collegeName,
    })
  }

  return (
    <>
      <div className="space-y-4">
        <CountrySelect
          value={value.country}
          onChange={handleCountryChange}
          disabled={disabled}
        />

        <StateSelect
          value={value.state}
          onChange={handleStateChange}
          country={value.country}
          disabled={disabled}
        />

        <DistrictSelect
          value={value.district}
          onChange={handleDistrictChange}
          state={value.state}
          disabled={disabled}
        />

        <CollegeSelect
          value={value.collegeId}
          onChange={handleCollegeChange}
          district={value.district}
          disabled={disabled}
          onNotFound={() => setShowNotFoundForm(true)}
          showNotFoundOption={true}
        />
      </div>

      <CollegeNotFoundForm
        isOpen={showNotFoundForm}
        onClose={() => setShowNotFoundForm(false)}
        country={value.country}
        state={value.state}
        district={value.district}
        onSubmitSuccess={() => {
          // Invalidate college list cache to show newly approved colleges
          // Refresh by clearing and re-fetching the colleges list
          setShowNotFoundForm(false)
          // User will need to manually re-select district to see new college
          // (Cache will be refreshed on next API call)
        }}
      />
    </>
  )
}
