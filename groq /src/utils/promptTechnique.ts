import { PromptingTechnique } from '../types';

export function getPromptingTechnique(exampleCount: number): {
  type: PromptingTechnique;
  label: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconColor: string;
  description: string;
} {
  if (exampleCount === 0) {
    return {
      type: 'Zero-shot',
      label: 'Zero-shot',
      badgeBg: 'bg-cyan-500/10',
      badgeBorder: 'border-cyan-500/30',
      badgeText: 'text-cyan-400',
      iconColor: '#22d3ee',
      description: 'Model relies entirely on its pre-trained knowledge with 0 examples.'
    };
  }

  if (exampleCount === 1) {
    return {
      type: 'One-shot',
      label: 'One-shot',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400',
      iconColor: '#fbbf24',
      description: 'Model is provided 1 example to illustrate the desired output structure and tone.'
    };
  }

  return {
    type: 'Few-shot',
    label: 'Few-shot',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
    iconColor: '#34d399',
    description: `Model is provided ${exampleCount} examples to condition consistent patterns and formatting.`
  };
}
