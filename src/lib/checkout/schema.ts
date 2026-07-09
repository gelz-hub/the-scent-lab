import { z } from 'zod'
import { CAMBODIA_PROVINCES } from './constants'

// Accepts common Cambodian mobile formats: 012 345 678, 012345678, +855 12 345 678, etc.
const PHONE_REGEX = /^(0|\+855)[1-9][0-9]{6,9}$/

export const addressSchema = z
  .object({
    recipientName: z.string().trim().min(1, 'Recipient name is required.').min(2, 'Enter a valid name.'),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone number is required.')
      .regex(PHONE_REGEX, 'Please enter a valid phone number.'),
    email: z.string().trim().email('Please enter a valid email.').optional().or(z.literal('')),
    province: z.enum(CAMBODIA_PROVINCES, { message: 'Please select a province.' }),
    district: z.string().trim().min(1, 'District / city is required.'),
    commune: z.string().trim().optional().or(z.literal('')),
    village: z.string().trim().optional().or(z.literal('')),
    houseNumber: z.string().trim().optional().or(z.literal('')),
    streetAddress: z.string().trim().min(3, 'Street address is required.'),
    postalCode: z.string().trim().optional().or(z.literal('')),
    deliveryType: z.enum(['HOME', 'OTHER_LOCATION']).default('HOME'),
    // Customer's preferred courier for province (LOGISTICS) orders — respected
    // through fulfillment unless staff has a valid reason to change it.
    deliveryCompany: z.enum(['JT_EXPRESS', 'VIREAK_BUNTHAM']).optional(),
    deliveryNote: z.string().trim().max(500).optional().or(z.literal('')),
    preferredDeliveryTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    const isLogistics = data.province !== 'Phnom Penh'
    if (isLogistics && !data.deliveryCompany) {
      ctx.addIssue({
        code: 'custom',
        path: ['deliveryCompany'],
        message: 'Please choose a delivery company.',
      })
    }
  })

export type AddressFormValues = z.output<typeof addressSchema>
export type AddressFormInput = z.input<typeof addressSchema>

export const paymentMethodSchema = z.enum([
  'ABA_KHQR',
  'ABA_PAYWAY',
  'CREDIT_CARD',
  'COD',
  'BANK_TRANSFER',
])

export const createOrderSchema = z.object({
  address: addressSchema,
  paymentMethod: paymentMethodSchema,
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        name: z.string().min(1),
        brand: z.string().min(1),
        image: z.string().min(1),
        ml: z.number().int().positive(),
        price: z.number().nonnegative(),
        qty: z.number().int().positive(),
      })
    )
    .min(1, 'Your cart is empty'),
  discount: z.number().nonnegative().default(0),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
