import React from 'react'
import { Box } from 'ink'

import { BackgroundFill } from '../core/BackgroundFill'
import type { InkColorValue } from '../../theme/theme-types'

export type PopupSheetProps = {
  width: number
  height: number
  paddingX: number
  paddingY: number
  background: InkColorValue
  children: React.ReactNode
}

export const PopupSheet: React.FC<PopupSheetProps> = ({
  width,
  height,
  paddingX,
  paddingY,
  background,
  children,
}) => {
  const safeWidth = Math.max(0, Math.floor(width))
  const safeHeight = Math.max(0, Math.floor(height))

  return (
    <Box width={safeWidth} height={safeHeight} overflow="hidden">
      <Box position="absolute" width={safeWidth} height={safeHeight} overflow="hidden">
        <BackgroundFill rows={safeHeight} columns={safeWidth} background={background} />
      </Box>

      <Box
        flexDirection="column"
        paddingX={paddingX}
        paddingY={paddingY}
        width={safeWidth}
        height={safeHeight}
        overflow="hidden"
      >
        {children}
      </Box>
    </Box>
  )
}
