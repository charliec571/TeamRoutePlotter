import type { PointOfInterest } from '../types'

export function buildShareText(
  groupName: string,
  points: PointOfInterest[],
  competitionName?: string,
): string {
  const lines = competitionName
    ? [`${competitionName} — Route for ${groupName}`, '']
    : [`Route for Team: ${groupName}`, '']

  points.forEach((point, index) => {
    const mapLink = `https://www.google.com/maps/@${point.latitude},${point.longitude},17z/data=!3m1!1e3`
    lines.push(`${index + 1}. ${point.name}`)
    lines.push(mapLink)
    lines.push('')
  })

  return lines.join('\n')
}

export async function shareRoute(
  groupName: string,
  points: PointOfInterest[],
  competitionName?: string,
): Promise<'shared' | 'copied'> {
  const text = buildShareText(groupName, points, competitionName)

  if (navigator.share) {
    try {
      await navigator.share({
        title: competitionName ? `${competitionName}: ${groupName}` : `Route for ${groupName}`,
        text,
      })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  await navigator.clipboard.writeText(text)
  return 'copied'
}
