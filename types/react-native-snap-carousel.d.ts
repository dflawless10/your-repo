
declare module 'react-native-snap-carousel' {
  import { Component } from 'react';
  import { FlatListProps, ViewStyle } from 'react-native';

  export interface CarouselProps<ItemT> extends FlatListProps<ItemT> {
    data: ItemT[];
    renderItem: ({ item, index }: { item: ItemT; index: number }) => JSX.Element;
    sliderWidth: number;
    itemWidth: number;
    containerCustomStyle?: ViewStyle;
    contentContainerCustomStyle?: ViewStyle;
    inactiveSlideScale?: number;
    inactiveSlideOpacity?: number;
    loop?: boolean;
    autoplay?: boolean;
    autoplayInterval?: number;
    // Add more props as needed
  }

  export default class Carousel<ItemT> extends Component<CarouselProps<ItemT>> {}
}