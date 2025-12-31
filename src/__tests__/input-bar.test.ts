import { estimateInputBarRows } from '../tui/components/core/input-bar-layout'
import { resolveInputBarPresentation } from '../tui/components/core/input-bar-presentation'

describe('InputBar presentation', () => {
  it('renders intent mode styling by default', () => {
    expect(resolveInputBarPresentation('intent')).toEqual({
      borderTone: 'default',
      label: 'Intent / Command',
      labelTone: 'muted',
      labelBold: false,
    })
  })

  it('renders refinement mode with prominent styling', () => {
    expect(resolveInputBarPresentation('refinement')).toEqual({
      borderTone: 'warning',
      label: 'Refinement (Enter to submit · empty to finish)',
      labelTone: 'warning',
      labelBold: true,
    })
  })

  it('estimates rows without border padding', () => {
    expect(
      estimateInputBarRows({
        value: 'one\ntwo\nthree',
      }),
    ).toBe(5)

    expect(
      estimateInputBarRows({
        value: Array.from({ length: 10 }, (_, index) => `line-${index}`).join('\n'),
      }),
    ).toBe(12)
  })
})
