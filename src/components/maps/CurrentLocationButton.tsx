'use client'

import { LocateFixed, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCurrentLocation } from '@/hooks/maps/use-current-location'
import type { ResolvedAddress } from '@/lib/maps/types'

interface CurrentLocationButtonProps {
  onResolved: (address: ResolvedAddress) => void
  className?: string
}

export function CurrentLocationButton({ onResolved, className }: CurrentLocationButtonProps) {
  const { locating, requestLocation } = useCurrentLocation()

  async function handleClick() {
    const address = await requestLocation()
    if (!address) {
      toast.error('Location permission denied. You can still enter your address manually.')
      return
    }
    onResolved(address)
    if (address.province) {
      toast.success('Location detected — please double-check the details below.')
    } else {
      toast.error("We couldn't detect your address. Please enter it manually.")
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={locating} className={className}>
      {locating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Detecting location…
        </>
      ) : (
        <>
          <LocateFixed className="h-4 w-4" strokeWidth={1.5} /> Use Current Location
        </>
      )}
    </Button>
  )
}
