import { memo } from 'react'
import PARYS_Elipse from 'src/components/icons/logo.svg'
import { Color } from 'src/styles/Color'

function _CheckmarkIcon({
  fill,
  height,
  width,
}: {
  fill?: string
  height?: string
  width?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width ?? 20}
      height={height ?? 20}
      viewBox="0 0 16 16"
    >
      <path
        fill={fill ?? Color.primaryGreen}
        d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"
      />
    </svg>
  )
}

export const CheckmarkIcon = memo(_CheckmarkIcon)

function _CheckmarkInElipseIcon() {
  return (
    // TODO remove the negative margin here
    // Requires trimming whitespace around elipse svg which will mess up the loading
    // indicator animation
    <div css={{ position: 'relative', marginBottom: '-0.6em' }}>
      <img src={PARYS_Elipse} alt="checkmark in elipse" css={{ height: '8em' }} />
      <div css={{ position: 'absolute', top: '35%', left: '29%', width: '2.7em' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 43.3">
          <path fill="#FFFFFF" d="M20.8 42.3L.7 27.2l6-8 12.2 9.1L39.3 1.1l8 6z" />
        </svg>
      </div>
    </div>
  )
}

export const CheckmarkInElipseIcon = memo(_CheckmarkInElipseIcon)
