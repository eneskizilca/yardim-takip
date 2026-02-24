export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return 'Bilinmeyen hata'
}
