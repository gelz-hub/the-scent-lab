'use client'

import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, type AddressFormInput, type AddressFormValues } from './schema'

export type AddressForm = UseFormReturn<AddressFormInput, unknown, AddressFormValues>

export function useAddressForm(defaultValues?: Partial<AddressFormValues>): AddressForm {
  return useForm<AddressFormInput, unknown, AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: 'onBlur',
    defaultValues: {
      deliveryType: 'HOME',
      ...defaultValues,
    },
  })
}

export const CONTACT_FIELDS = ['recipientName', 'phone', 'email'] as const
export const ADDRESS_FIELDS = ['province', 'district', 'commune', 'village', 'houseNumber', 'streetAddress'] as const
export const DELIVERY_FIELDS = ['deliveryType', 'deliveryCompany', 'deliveryNote', 'preferredDeliveryTime'] as const
