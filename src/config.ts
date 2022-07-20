import type {iconsaxNames} from '@erbium/iconsax/utilities';

type route = {id: string; icon: iconsaxNames};

export const Tools: route[] = [
  {
    id: 'flow-rate-calculator-gunya-method',
    icon: 'drop',
  },
];

export const mainNavigation: route[] = [
  {
    id: 'home',
    icon: 'home-2',
  },
  {
    id: 'about',
    icon: 'info-circle',
  },
  ...Tools,
];
