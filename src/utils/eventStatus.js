// Two admin surfaces approve events: this app's AdminPortal writes 'approved', and
// the barista admin app (brb-baristas) writes 'booked'. Both values are already
// live in the events collection, so every reader normalizes the status instead of
// matching one spelling and silently mislabeling the other.

const APPROVED_ALIASES = ['approved', 'booked', 'confirmed']

export const normalizeEventStatus = (status) => {
  const value = String(status || 'pending').toLowerCase()
  if (APPROVED_ALIASES.includes(value)) return 'approved'
  return value
}

export const isApprovedEvent = (event) => normalizeEventStatus(event?.status) === 'approved'

export const isPendingEvent = (event) => normalizeEventStatus(event?.status) === 'pending'
