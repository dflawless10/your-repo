import { API_BASE_URL } from '@/config';

import React, {useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Animated,
  TouchableOpacity,
  Text,
  Pressable,
  Platform,
  Modal,
  Alert,
  FlatList,
  ScrollView,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {Link, useRouter} from 'expo-router';
import { Avatar } from 'app/components/Avatar'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCartBackend } from 'hooks/usecartBackend';
import GiftDiscoveryModal from '@/app/components/GiftDiscoveryModal';
import { BidGoatMenuModal } from './BidGoatMenuModal';
import { SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import EnhancedNotificationBell from './EnhancedNotificationBell';
import { EnhancedNotification, getNotificationBadgeConfig } from '@/types/notifications';
import ElasticsearchResultCard from './ElasticsearchResultCard';
import { useTheme } from '@/app/theme/ThemeContext';
interface HeaderProps {
  scrollY: Animated.Value;
  title?: string;
  subtitle?: string;
  username?: string | null;
  avatarUrl?: string | null;
  onSearch?: (text: string) => void;
  embedded?: boolean;
  onSelect?: (result: any) => void; // <-- add this
}

// Define a result type
interface SearchResult {
  label: string;
  value: string | number;
  type: 'user' | 'item' | (string & {});
  // ❌ problem here
  extra?: {
    price?: number;
    image?: string;
    description?: string;
  };
  score: number;
}


// Then declare allResults with that type
let allResults: SearchResult[] = [];


interface SearchBarProps {
  onSelect?: (result: any) => void;
}


type Birthstone = {
  month: string;
  stone: string;
  color: string;
  meaning: string;
};

type CategoryItem = {
  label: string;
  key: string;
  keywords?: string[]; // optional so old code doesn’t break
};


type CategoryGroup = {
  label: string;
  items: CategoryItem[];
};

const categories: CategoryGroup[] = [
  {
    label: 'Account',
    items: [
      { label: 'Sign In', key: 'sign-in' },
      { label: 'Register', key: 'register' },
    ],
  },
  {
    label: 'Getting Started',
    items: [
      { label: 'Why BidGoat?', key: 'landing' },
      { label: 'Welcome', key: 'welcome' },
      { label: 'Help', key: 'help' },
      { label: 'Contact', key: 'contact' },
    ],
  },
  {
  label: 'Jewelry Categories',
  items: [
    {
      label: 'Rings',
      key: 'rings',
      keywords:[
 'ring',
'heart shape',
'emerald shape',
'oval shape',
'pear shape',
'cushion cut',
'princess cut',
'round diamond',
'size',
'eternity',
'womens',
'mens',
'cocktail',
'engagement',
'wedding',
'band',
'jewelry',
  'diamond ring',
  'diamond rings',
  '2 carat diamond ring',
  'black diamond ring',
  '3 carat diamond ring',
  'diamond rings for women',
  'princess cut diamond ring',
  '1 carat diamond ring',
  '5 carat diamond ring',
  '4 carat diamond ring',
  'pink diamond ring',
  '2ct diamond ring',
  'blue diamond ring',
  'emerald cut diamond ring',
  'lab created diamond rings',
  'lab grown diamond rings',
  'marquise diamond ring',
  'oval diamond ring',
  '1.5 carat diamond ring',
  '10 carat diamond ring',
  'chocolate diamond ring',
  'costco diamond rings',
  'diamond nose ring',
  'diamond ring for women',
  'diamonds rings',
  'emerald diamond ring',
  'pear shaped diamond ring',
  'yellow diamond ring',
  'yellow diamond rings',
  '1ct diamond ring',
  'diamond band ring',
  'diamond cluster ring',
  'gold diamond ring',
  'salt and pepper diamond ring',
  'sapphire and diamond ring',
  'solitaire diamond ring',
  'square diamond ring',
  '2 carat oval diamond ring',
  '2.5 carat diamond ring',
  'baguette diamond ring',
  'black diamond rings',
  'chocolate diamond rings',
  'diamond gold ring',
  'diamond ring shapes',
  'diamond solitaire ring',
  'emerald and diamond ring',
  'green diamond ring',
  'heart diamond ring',
  'lab diamond rings',
  'levian chocolate diamond ring',
  'sapphire diamond ring',
  '1 ct diamond ring',
  '2 ct diamond ring',
  '3ct diamond ring',
  '6 carat diamond ring',
  'big diamond rings',
  'blue diamond rings',
  'diamond ear rings',
  'diamond promise rings',
  'diamond rings for sale',
  'diamonds ring',
  'emerald cut diamond rings',
  'gold diamond rings',
  'halo diamond ring',
  'heart shaped diamond ring',
  'how to clean diamond ring',
  'moissanite rings vs diamond',
  'pink diamond rings',
  'real diamond rings',
  'solitaire diamond rings',
  'tiffany diamond ring',
  'vintage diamond rings',
  'womens diamond ring',
  '2 carat emerald cut diamond ring',
  '3 carat oval diamond ring',
  '4ct diamond ring',
  '8 carat diamond ring',
  'carat diamond ring',
  'cartier diamond ring',
  'diamond anniversary rings',
  'diamond ring cuts',
  'diamond ring settings',
  'diamond rings women',
  'diamonds rings for women',
  'emerald diamond rings',
  'emerald ring with diamonds',
  'fake diamond rings',
  'gold ring with diamonds',
  'lab created diamond ring',
  'lab grown diamond ring',
  'one carat diamond ring',
  'pear diamond ring',
  'engagement rings',
  'engagement rings for women',
  'engagement ring',
  'moissanite engagement rings',
  'unique engagement rings',
  'emerald cut engagement rings',
  'oval engagement rings',
  'vintage engagement rings',
  'emerald engagement rings',
  'rose gold engagement rings',
  'sapphire engagement rings',
  'jlo engagement ring',
  'megan fox engagement ring',
  'pear shaped engagement ring',
  'cheap engagement rings',
  'gold engagement rings',
  'jennifer lopez engagement ring',
  'opal engagement ring',
  'simple engagement rings',
  'tiffany engagement rings',
  'art deco engagement rings',
  'custom engagement rings',
  'engagement ring styles',
  'engagment rings',
  'moss agate engagement ring',
  'princess cut engagement ring',
  'princess cut engagement rings',
  'zales engagement rings',
  'buy engagement ring',
  'cushion cut engagement rings',
  'engagement rings near me',
  'halo engagement rings',
  'kay jewelers engagement rings',
  'moissanite engagement ring',
  'morganite engagement ring',
  'radiant cut engagement rings',
  'ruby engagement rings',
  'affordable engagement rings',
  'alexandrite engagement ring',
  'antique engagement rings',
  'black engagement rings',
  'disney engagement rings',
  'engagement ring insurance',
  'engagment ring',
  'gemstone engagement rings',
  'hidden halo engagement ring',
  'marquise engagement ring',
  'oval engagement ring',
  'solitaire engagement ring',
  'teardrop engagement ring',
  'vintage engagement ring',
  'women’s engagement rings',
  '3 stone engagement ring',
  'aquamarine engagement ring',
  'average engagement ring cost',
  'cartier engagement rings',
  'celebrity engagement rings',
  'engagement ring settings',
  'gold engagement ring',
  'gold engagement rings for women',
  'halo ring engagement',
  'jared engagement rings',
  'jennifer lopez engagement rings',
  'kourtney kardashian engagement ring',
  'meghan markle engagement ring',
  'neil lane engagement rings',
  'pearl engagement rings',
  'rose gold engagement ring',
  'round engagement rings',
  'three stone engagement ring',
  'walmart engagement rings',
  'white gold engagement rings',
  'white sapphire engagement rings',
  '2 carat engagement ring',
  'amethyst engagement ring',
  'ariana grande engagement ring',
  'blake lively engagement ring',
  'costco engagement rings',
  'custom engagement ring',
  'dainty engagement rings',
  'emerald engagement ring',
  'engagement ring sets',
  'engagement rings gold',
  'hailey bieber engagement ring',
  'how much to spend on engagement ring',
  'j lo engagement ring',
  'moonstone engagement ring',
  'pandora engagement rings',
   'pear engagement rings',
  'princess diana engagement ring',
  'sapphire engagement ring',
  'square engagement rings',
  'tiffany engagement ring',
  'unique engagement rings for women',
  'women engagement rings',
  'yellow gold engagement rings',
  'zales engagement ring',
  'average cost of engagement ring',
  'best engagement rings',
  'customize engagement rings',
        'mens rings',
  'rings for men',
  'men rings',
  'mens ring',
  'gold rings for men',
  'men ring',
  'mens gold ring',
  'silicone rings for men',
  'gold ring men',
  'mens gold rings',
  'mens pinky rings',
  'promise rings for men',
  'gold ring for men',
  'men gold ring',
  'mens promise rings',
  'mens ring size chart',
  'gold mens ring',
  'men promise rings',
  'mens nose ring',
  'mens pinky ring',
  'ring for men',
  'silver rings for men',
  'tungsten rings for men',
  'black rings for men',
  'men’s rings',
  'mens signet ring',
  'pinky rings for men',
  'rubber rings for men',
  'cartier mens rings',
  'gold pinky ring mens',
  'gold rings men',
  'gucci ring mens',
  'men gold rings',
  'mens emerald rings',
  'mens promise ring',
  'mens ruby rings',
  'mens silver rings',
  'mens sterling silver rings',
  'mens turquoise ring',
  'ring men',
  'custom rings for men',
  'emerald ring for men',
  'men pinky ring',
  'mens rings gold',
  'mens signet rings',
  'promise ring for men',
  'rings men',
  'silver ring for men',
  'titanium rings for men',
  'unique mens rings',
  'wooden rings for men',
  '14k gold ring mens',
  'cool mens rings',
  'cool rings for men',
  'gay men ring',
  'men’s skull rings',
  'mens black onyx ring',
  'mens claddagh ring',
  'mens silicone rings',
  'pinky ring for men',
  'platinum ring for men',
  'signet ring men',
  'silver rings men',
  'skull rings for men',
  'white gold rings for men',
  '18k gold ring mens',
  'average ring size for men',
  'cartier ring men',

  'wedding rings',
  'wedding ring',
  'wedding rings for women',
  'how much money should you spend on a wedding ring',
  'which finger does a wedding ring go on',
  'wedding ring sets',
  'the wedding ringer',
  'wedding ring set',
  'wedding rings sets',
  'weddings rings',
  'unique wedding rings',

  'stacked wedding rings',
  'vintage wedding rings',
  'wedding ring sets his and hers',
  'what hand does a wedding ring go on',
  'black wedding rings',
  'wedding ring tattoos',
  'women wedding rings',
  'cheap wedding rings',
  'emerald wedding rings',
  'gold wedding ring',
  'gold wedding rings for women',
  'opal wedding rings',
  'oval wedding rings',
  'rose gold wedding rings',
  'wedding ring sets for women',
  'wedding ringer',
  'womens wedding ring sets',
  'silicone wedding rings',
  'simple wedding rings',
  'walmart wedding rings',
  'wedding ring for women',
  'wedding ring tattoo',
  'wedding rings set',
  'black wedding ring',
  'custom wedding rings',
  'male wedding rings',
  'rings wedding',
  'wedding ring sets for him and her',
  'western wedding rings',
  'what hand does the wedding ring go on',
  'womens wedding ring',
  'zales wedding rings',
  'antique wedding rings',
  'hailey bieber wedding ring',
  'kay jewelers wedding rings',
  'princess cut wedding rings',
  'sapphire wedding rings',
  'turquoise wedding ring',
  'wedding ring box',
  'wedding ring hand',
  'wedding ring tattoo ideas',
  'which hand does the wedding ring go on',
  'women’s wedding rings',
  'womens wedding rings',
  'wooden wedding rings',
  'amber heard wedding ring',
  'black wedding rings for women',
  'diamong wedding rings',
  'gothic wedding rings',
  'moissanite wedding rings',
  'rubber wedding rings',
  'ruby wedding rings',
  'set wedding ring',
  'silicone wedding ring',
  'silver wedding rings',
  'tattoo wedding rings',
  'the wedding ringer cast',
  'tiffany wedding rings',
  'wedding dimond ring',
  'wedding ring band',
  'wedding ring clipart',
  'wedding ring styles',
  'wedding ringer cast',
  'wedding set rings',
  'what finger does a wedding ring go on',
  'what hand do you wear your wedding ring on',
  'which hand wedding ring',
  'which hand wedding ring female',
  'white gold wedding rings',
  'ariana grande wedding ring',
  'average wedding ring cost',
  'big wedding rings',
  'cartier wedding ring',
  'cast wedding ringer',
  'clip art of wedding rings',
  'costco wedding rings',
  'disney wedding rings',
  'emerald wedding ring',
  'expensive wedding rings',
  'his and hers wedding ring sets',
  'megan fox wedding ring',
  'meghan markle wedding ring',
  'opal wedding ring'


      ]

    },
    {
      label: 'Necklaces',
      key: 'necklaces',
      keywords: [
  'initial necklace silver',
  'silver heart necklace',
  'silver sterling necklaces',
  'sterling silver necklaces',
  'how to clean silver necklace',
  'name necklace silver',
  'mens silver necklace',
  'mens sterling silver necklace',
  'necklace silver',
  'silver necklace men',
  'silver necklaces for women',
  'sterling silver cross necklace',
  'silver choker necklace',
  'silver layered necklace',
  'silver pendant necklace',
  'dainty silver necklace',
  'men silver necklace',
  'silver cross necklace mens',
  'silver necklace women',
  'womens necklace silver',
  'heart necklace silver',
  'men’s silver necklace',
  'silver butterfly necklace',
  'silver name necklace',
  'sterling silver name necklace',
  'chunky silver necklace',
  'cross necklace silver',
  'long silver necklace',
  'silver herringbone necklace',
  'silver necklace with cross',
  'simple silver necklace',
  'sterling silver cross necklace mens',
  'sterling silver initial necklace',
  'sterling silver necklace womens',
  'sterling silver necklaces for women',
  'tiffany silver necklace',
  'kendra scott silver necklace',
  'moon necklace silver',
  'pandora silver necklace',
  'silver bar necklace',
  'silver bead necklace',
  'silver cross necklace womens',
  'silver initial necklace',
  'silver mens necklace',
  'silver necklace mens',
  'sterling silver heart necklace',
  'sterling silver men necklace',
  'sterling silver mens necklace',
  'women’s necklaces silver',
  'letter necklace silver',
  'necklace extender silver',
  'necklace sterling silver',
  'opal necklace silver',
  'real silver necklace',
  'silver charm necklace',
  'silver evil eye necklace',
  'silver locket necklace',
  'silver necklace star',
  'silver necklaces for men',
  'silver statement necklace',
  'sterling silver necklace for women',
  'sterling silver necklace men',
  'tiffany heart necklace silver',
  'women’s necklace silver',
  'butterfly necklace silver',
  'cross necklace mens silver',
  'mens silver cross necklace',
  'silver cross necklace for men',
  'silver cross necklaces for women',
  'silver infinity necklace',
  'silver layered necklaces',
  'overnight shipping necklace',
  'necklace overnight shipping',
  'name necklace overnight shipping',
  'custom necklace overnight shipping',
  'personalized necklace overnight shipping',
  'engraved necklace overnight shipping',
  'initial necklace overnight shipping',
  'gold necklace overnight shipping',
  'silver necklace overnight shipping',
  'last minute necklace overnight shipping',
   'necklace 2 day shipping',
  '2 day shipping necklace',
  'name necklace 2 day shipping',
  'custom necklace 2 day shipping',
  'personalized necklace 2 day shipping',
  'engraved necklace 2 day shipping',
  'initial necklace 2 day shipping',
  'gold necklace 2 day shipping',
  'silver necklace 2 day shipping',
  'last minute gift 2 day shipping',
   'gold necklace',
  'gold cross necklace',
  'gold necklace women',
  'gold name necklace',
  'gold necklace for men',
  'gold necklaces',
  'gold heart necklace',
  'gold initial necklace',
  'gold necklaces for women',
  'gold pendant necklace',
  'mens gold necklace',
  'name necklace gold',
  'necklace gold',
  'rose gold necklace',
  'white gold necklace',
  'gold name plate necklace',
  'initial necklace gold',
  'mens gold cross necklace',
  '14k gold necklace',
  'dainty gold necklace',
  'gold choker necklace',
  'gold necklaces for men',
  'golden necklace',
  'mens gold necklaces',
  'gold butterfly necklace',
  'gold cross necklace for men',
  'gold cross necklace for women',
  'gold locket necklace',
  'letter necklace gold',
  '14kt gold necklace',
  '18k gold necklace',
  'necklace',
  'silver necklaces',
  'silver necklace for women',
  'silver necklace for men',
  'silver cross necklace',
  'sterling silver necklace',
  'silver necklace',
  'chain',
  'pendant',
  'gold',
  'silver',
  'custom name necklace gold',
  'gold coin necklace',
  'gold evil eye necklace',
  'gold necklace 14k',
  'gold necklace men',
  'gold paperclip necklace',
  'gold rosary necklace',
  'real gold necklace',
  'womens gold necklace',
  '14 karat gold necklace',
  '14k gold name necklace',
  '14k gold necklaces',
  '24k gold necklace',
  'gold bar necklace',
  'gold herringbone necklace',
  'gold layered necklace',
  'gold necklace with name',
  'gold plated necklace',
  'men’s gold necklaces',
  'mens white gold necklace',
  'names necklace gold',
  'pendant necklace gold',
  'tiffany gold necklace',
  '14 kt gold necklace',
  '14k gold necklace womens',
  'chunky gold necklace',
  'emerald necklace gold',
  'gold bead necklace',
  'gold charm necklace',
  'gold necklace with initials',
  'layered gold necklace',
  'simple gold necklace',
  'white gold cross necklace',
  '14 k gold necklace',
  '14k gold cross necklace',
  'cross necklace gold',
  'custom gold necklace',
  'gold 14k necklace',
  'gold medallion necklace',
  'gold necklace with pendant',
  'gold paper clip necklace',
  'gold virgin mary necklace',
  'golden necklaces',
  'heart necklace gold',
  'herringbone gold necklace',
  'long gold necklace',
  'men gold necklace',
  'necklace 14k gold',
  'real gold necklace for women',
  'holiday shipping necklace',
  'christmas shipping necklace',
  'holiday gift necklace fast shipping',
  'last minute holiday necklace',
  'holiday delivery necklace',
  'holiday rush necklace',
  'holiday gift necklace',
  'christmas necklace fast shipping',
  'holiday personalized necklace',
  'holiday name necklace',
   'necklace free shipping',
  'free shipping necklace',
  'name necklace free shipping',
  'mens necklace free shipping',
  'womens necklace free shipping',
  'personalized necklace free shipping',
  'custom necklace free shipping',
  'initial necklace free shipping',
  'gold necklace free shipping',
  'silver necklace free shipping',
  'engraved necklace free shipping',
  'chain necklace',
  'mens chain necklace',
  'necklace chain',
  'chain necklace for men',
  'chain link necklace',
  'chain necklaces',
  'men chain necklace',
  'mens necklace chain',
  'paperclip chain necklace',
  'mens necklace free shipping',
  'name necklace 2 day shipping',
  'name necklace fast shipping',
  'name necklace free shipping',
  'necklace free shipping',
  'necklace shipping boxes',
  'personalized name necklace fast shipping',
  'personalized necklace fast shipping',
  'pirate ship necklace',
  'rocket ship necklace',
  'fast shipping necklace',
  'necklace fast shipping',
  'name necklace fast shipping',
  'personalized necklace fast shipping',
  'custom necklace fast shipping',
  'engraved necklace fast shipping',
  'initial necklace fast shipping',
  'gold necklace fast shipping',
  'silver necklace fast shipping',
  'mens necklace fast shipping',
  'womens necklace fast shipping',
  'gift necklace fast shipping',
  'last minute necklace fast shipping',
  'gift necklace fast shipping',
  'gift necklace free shipping',
  'gift ready necklace',
  'gift box necklace shipping',
  'gift necklace delivery',
  'last minute gift necklace',
  'birthday gift necklace shipping',
  'anniversary gift necklace shipping',
  'custom gift necklace shipping',
  'personalized gift necklace shipping'


 ]

    },
    {
      label: 'Bracelets',
      key: 'bracelets',
      keywords: [
  'gold bracelets',
  'gold bracelet',
  'gold bracelets for women',
  'gold bangle bracelet',
  'bracelet gold',
  'gold bracelet for women',
  '14k gold bracelet',
  'gold ankle bracelet',
  'gold bracelet womens',
  'gold charm bracelet',
  'baby gold bracelet',
  'gold bead bracelet',
  'gold bracelets women',
  'gold tennis bracelet',
  'rose gold bracelet',
  'cartier gold bracelet',
  'gold baby bracelet',
  'gold cuff bracelet',
  'gold pandora bracelet',
  'pandora gold bracelet',
  'white gold bracelet',
  'women gold bracelet',
  'gold bangle bracelets',
  'gold bracelets womens',
  'gold cuban link bracelet',
  'pandora rose gold bracelet',
  'tiffany gold bracelet',
  '14 k gold bracelet',
  '14 kt gold bracelet',
  '14k gold bracelets',
  '14kt gold bracelet',
  '18k gold bracelet',
  'evil eye bracelet gold',
  'gold 14k bracelet',
  'gold bracelet 14k',
  'golden bracelet',
  'rose gold bracelets',
  'women gold bracelets',
  'womens gold bracelet',
  '14k gold bracelet womens',
  'bracelet 14k gold',
  'cartier bracelet gold',
  'gold ankle bracelets',
  'gold cartier bracelet',
  'golden bangle bracelet',
  'pandora bracelet gold',
  'rose gold pandora bracelet',
  'white gold bracelet womens',
  'women’s gold bracelets',
  '10k gold bracelet',
  '14k gold bangle bracelet',
  '24k gold bracelet',
  'baby bracelets gold',
  'bracelet gold 14k',
  'bracelets gold',
  'dainty gold bracelet',
  'david yurman gold bracelets',
  'gold beaded bracelet',
  'gold charms for bracelets',
  'rose gold bracelet womens',
  'tennis bracelet gold',
  'women’s bracelets gold',
  'bracelet rose gold',
        'silver bracelet',
  'silver bracelets',
  'sterling silver bracelets',
  'silver bracelets for women',
  'sterling silver bracelet',
  'tiffany silver bracelet',
  'bracelet silver',
  'silver bangle bracelets',
  'silver bracelet for women',
  'silver cuff bracelet',
  'sterling silver charm bracelet',
  'bracelets silver',
  'silver charm bracelet',
  'bracelet sterling silver',
  'silver charms for bracelets',
  'sterling silver bracelets for women',
  'tiffany bracelet silver',
  'women’s silver bracelets',
  'pandora silver bracelet',
  'silver bead bracelet',
  'silver cartier bracelet',
  'silver charm bracelets',
  'silver cuban link bracelet',
  'sterling silver bangle bracelets',
  'sterling silver bracelets womens',
  'cartier bracelet silver',
  'silver ankle bracelet',
  'silver bangle bracelet',
  'sterling silver ankle bracelet',
  'sterling silver charm bracelets',
  'sterling silver charms for bracelets',
  'sterling silver cuff bracelet',
  'tiffany silver bracelet heart',
  'tiffany sterling silver bracelet',
  '925 sterling silver bracelet',
  'silver tennis bracelet',
  'tiffany silver bracelets',
  'womens silver bracelet',
  'womens silver bracelets',
  '925 silver bracelet',
  'cuban link bracelet silver',
  'man silver bracelet',
  'silver cuff bracelets',
  'silver evil eye bracelet',
  'silver pandora bracelet',
  'sterling silver bangle bracelet',
  'sterling silver bracelet charms',
  'tiffany bracelets silver',
  'tiffany heart bracelet silver',
  'cartier love bracelet silver',
  'cartier silver bracelet',
  'gucci silver bracelet',
  'silver ankle bracelets',
  'silver diamond bracelet',
  'silver tiffany bracelet',
  'sterling silver cuff bracelets',
  'sterling silver tennis bracelet',
  'tiffany charm bracelet silver',
  'tiffany silver heart bracelet',
  'women silver bracelet',
  'bead bracelet silver',
  'bracelets sterling silver',
  'charm bracelet sterling silver',
  'louis vuitton silver bracelet',
  'pandora bracelet silver',
  'silver beaded bracelet',
  'silver bracelet charms',
  'silver heart bracelet',
  'sterling silver ankle bracelets',
  'sterling silver beaded bracelet',
  'sterling silver bracelets women',
  'sterling silver evil eye bracelet',
  'sterling silver tiffany bracelet',
  'women’s sterling silver bracelet',
  '925 sterling silver bracelets',
  'amazon silver bracelets',
  'chunky silver bracelet',
  'cuban link silver bracelet',
  'dainty silver bracelet',
  'david yurman silver bracelet',
  'engraved silver bracelet',
  'hermes bracelet silver',
  'hermes silver bracelet',
  'mexican silver bracelets',
  'pandora silver charm bracelet',
  'silver and turquoise bracelet',
  'silver bracelets women',
  'silver cuff bracelet womens',
  'silver turquoise bracelet',
        'mens bracelets',
  'bracelets for men',
  'mens bracelet',
  'men’s bracelets',
  'men bracelet',
  'men bracelets',
  'mens diamond bracelet',
  'bracelet for men',
  'cartier bracelet men',
  'louis vuitton bracelet men',
  'mens beaded bracelets',
  'beaded bracelets for men',
  'copper bracelet for men',
  'david yurman mens bracelet',
  'mens beaded bracelet',
  'cartier bracelet mens',
  'gucci bracelet mens',
  'lv bracelet men',
  'mens cuban link bracelet',
  'cartier mens bracelet',
  'hermes mens bracelet',
  'men bead bracelet',
  'men’s tennis bracelet',
  'mens ankle bracelet',
  'mens cuff bracelets',
  'mens designer bracelets',
  'mens stainless steel bracelets',
  'tennis bracelet mens',
  'bead bracelets for men',
  'bracelet men',
  'cartier men bracelet',
  'medical bracelets for men',
  'men diamond bracelet',
  'mens black bracelet',
  'mens pandora bracelet',
  'mens tennis bracelet',
  'mens turquoise bracelet',
  'personalized bracelets for men',
  'tiffany mens bracelet',
  'cool bracelets for men',
  'copper bracelets for men',
  'diamond bracelet mens',
  'engraved bracelets for men',
  'men stainless steel bracelet',
  'men’s bead bracelets',
  'men’s bracelet',
  'mens bead bracelet',
  'mens cartier bracelet',
  'mens copper bracelet',
  'mens diamond tennis bracelet',
  'mens stainless steel bracelet',
  'stainless steel mens bracelet',
  'custom bracelets for men',
  'louis vuitton mens bracelet',
  'men cartier bracelet',
  'mens evil eye bracelet',
  'mens id bracelet',
  'mens magnetic bracelets',
  'mens pearl bracelet',
  'mens rope bracelets',
  'best mens bracelets',
  'bracelet men’s',
  'bracelets for men custom',
  'cartier love bracelet men',
  'cross bracelet mens',
  'david yurman men bracelet',
  'fishers of men bracelet',
  'hermes bracelet men',
  'id bracelets for men',
  'james avery mens bracelets',
  'lv mens bracelet',
  'magnetic bracelets for men',
  'medical alert bracelets for men',
  'medical id bracelets for men',
  'men copper bracelet',
  'men designer bracelet',
        'mens bracelets',
  'bracelets for men',
  'mens bracelet',
  'men’s bracelets',
  'men bracelet',
  'men bracelets',
  'mens diamond bracelet',
  'bracelet for men',
  'cartier bracelet men',
  'louis vuitton bracelet men',
  'mens beaded bracelets',
  'beaded bracelets for men',
  'copper bracelet for men',
  'david yurman mens bracelet',
  'mens beaded bracelet',
  'cartier bracelet mens',
  'gucci bracelet mens',
  'lv bracelet men',
  'mens cuban link bracelet',
  'cartier mens bracelet',
  'hermes mens bracelet',
  'men bead bracelet',
  'men’s tennis bracelet',
  'mens ankle bracelet',
  'mens cuff bracelets',
  'mens designer bracelets',
  'mens stainless steel bracelets',
  'tennis bracelet mens',
  'bead bracelets for men',
  'bracelet men',
  'cartier men bracelet',
  'medical bracelets for men',
  'men diamond bracelet',
  'mens black bracelet',
  'mens pandora bracelet',
  'mens tennis bracelet',
  'mens turquoise bracelet',
  'personalized bracelets for men',
  'tiffany mens bracelet',
  'cool bracelets for men',
  'copper bracelets for men',
  'diamond bracelet mens',
  'engraved bracelets for men',
  'men stainless steel bracelet',
  'men’s bead bracelets',
  'men’s bracelet',
  'mens bead bracelet',
  'mens cartier bracelet',
  'mens copper bracelet',
  'mens diamond tennis bracelet',
  'mens stainless steel bracelet',
  'stainless steel mens bracelet',
  'custom bracelets for men',
  'louis vuitton mens bracelet',
  'men cartier bracelet',
  'mens evil eye bracelet',
  'mens id bracelet',
  'mens magnetic bracelets',
  'mens pearl bracelet',
  'mens rope bracelets',
  'best mens bracelets',
  'bracelet men’s',
  'bracelets for men custom',
  'cartier love bracelet men',
  'cross bracelet mens',
  'david yurman men bracelet',
  'fishers of men bracelet',
  'hermes bracelet men',
  'id bracelets for men',
  'james avery mens bracelets',
  'lv mens bracelet',
  'magnetic bracelets for men',
  'medical alert bracelets for men',
  'medical id bracelets for men',
  'men copper bracelet',
  'men designer bracelet',
        'mens bracelets',
  'bracelets for men',
  'mens bracelet',
  'men’s bracelets',
  'men bracelet',
  'men bracelets',
  'mens diamond bracelet',
  'bracelet for men',
  'cartier bracelet men',
  'louis vuitton bracelet men',
  'mens beaded bracelets',
  'beaded bracelets for men',
  'copper bracelet for men',
  'david yurman mens bracelet',
  'mens beaded bracelet',
  'cartier bracelet mens',
  'gucci bracelet mens',
  'lv bracelet men',
  'mens cuban link bracelet',
  'cartier mens bracelet',
  'hermes mens bracelet',
  'men bead bracelet',
  'men’s tennis bracelet',
  'mens ankle bracelet',
  'mens cuff bracelets',
  'mens designer bracelets',
  'mens stainless steel bracelets',
  'tennis bracelet mens',
  'bead bracelets for men',
  'bracelet men',
  'cartier men bracelet',
  'medical bracelets for men',
  'men diamond bracelet',
  'mens black bracelet',
  'mens pandora bracelet',
  'mens tennis bracelet',
  'mens turquoise bracelet',
  'personalized bracelets for men',
  'tiffany mens bracelet',
  'cool bracelets for men',
  'copper bracelets for men',
  'diamond bracelet mens',
  'engraved bracelets for men',
  'men stainless steel bracelet',
  'men’s bead bracelets',
  'men’s bracelet',
  'mens bead bracelet',
  'mens cartier bracelet',
  'mens copper bracelet',
  'mens diamond tennis bracelet',
  'mens stainless steel bracelet',
  'stainless steel mens bracelet',
  'custom bracelets for men',
  'louis vuitton mens bracelet',
  'men cartier bracelet',
  'mens evil eye bracelet',
  'mens id bracelet',
  'mens magnetic bracelets',
  'mens pearl bracelet',
  'mens rope bracelets',
  'best mens bracelets',
  'bracelet men’s',
  'bracelets for men custom',
  'cartier love bracelet men',
  'cross bracelet mens',
  'david yurman men bracelet',
  'fishers of men bracelet',
  'hermes bracelet men',
  'id bracelets for men',
  'james avery mens bracelets',
  'lv mens bracelet',
  'magnetic bracelets for men',
  'medical alert bracelets for men',
  'medical id bracelets for men',
  'men copper bracelet',
  'men designer bracelet',
        'chain bracelet',
  'bracelet chain',
  'bracelet ring chain',
  'chain bracelets',
  'chain link bracelet',
  'daisy chain bracelet',
  'tiffany chain bracelet',
  'pandora chain bracelet',
  'chain bracelet womens',
  'david yurman chain bracelet',
  'pandora snake chain bracelet',
  'rope chain bracelet',
  'bike chain bracelet',
  'cuban chain bracelet',
  'daisy chain friendship bracelet',
  'hand chain bracelet',
  'motorcycle chain bracelet',
  'snake chain bracelet',
  'tennis chain bracelet',
  'tiffany and co chain bracelet',
  'charm bracelet chain',
  'curb chain bracelet',
  'pandora moments snake chain bracelet',
  'box chain bracelet',
  'bracelet safety chain',
  'chain ring bracelet',
  'daisy chain bracelet pattern',
  'flower chain bracelet',
  'link chain bracelet',
  'ring bracelet chain',
  'bracelet chains',
  'cartier chain bracelet',
  'chain bracelets for women',
  'cuban link chain bracelet',
  'figaro chain bracelet',
  'louis vuitton chain bracelet',
  'safety chain on bracelet',
  'tennis bracelet chain',
  'tiffany’s chain bracelet',
  'chain link bracelets',
  'chains bracelets',
  'david yurman box chain bracelet',
  'diamond chain bracelet',
  'heart chain bracelet',
  'louis vuitton monogram chain bracelet',
  'pandora bracelet safety chain',
  'paperclip chain bracelet',
  'ring chain bracelet',
  'tiffany & co chain bracelet',
  'tiffany tag chain bracelet',
  'black chain bracelet',
  'bracelet chain types',
  'chain bracelet tiffany',
  'chrome hearts paper chain bracelet',
  'key chain bracelet',
  'lv chain links bracelet',
  'pandora moments heart clasp snake chain bracelet',
  'ring and bracelet chain',
  'thin chain bracelet',
  'women’s chain bracelets',
  'alex and ani pull chain bracelet',
  'anchor chain bracelet',
  'bicycle chain bracelet',
  'bracelet key chain'
]

    },
    {
      label: 'Earrings',
      key: 'earrings',
      keywords: [
  'sterling silver earrings',
  'silver earrings',
  'silver dangle earrings',
  'silver earrings for women',
  'earrings silver',
  'earrings sterling silver',
  'silver drop earrings',
  'silver forest earrings',
  'silver earring',
  'sterling silver earring',
  'mens earrings silver',
  'prom earrings silver',
  'earrings silver forest',
  'huggie earrings silver',
  'long silver earrings',
  'real silver earrings',
  'silver chandelier earrings',
  'silver clip on earrings',
  'silver earrings for men',
  'silver huggie earrings',
  'silver statement earrings',
  'sterling silver dangle earrings',
  'womens earrings silver',
  '925 sterling silver earrings',
  'earring silver',
  'gucci earrings silver',
  'silver heart earrings',
  'tiffany earrings silver',
  'dangle silver earrings',
  'mens silver earrings',
  'mens sterling silver earrings',
  'silver cross earrings',
  'silver earrings dangle',
  'silver earrings women',
  'silver pearl earrings',
  'sterling silver drop earrings',
  'sterling silver earring sets',
  'sterling silver huggie earrings',
  'wedding earrings silver',
  'drop earrings silver',
  'silver ball earrings',
  'silver threader earrings',
  'womens sterling silver earrings',
  'dangle earrings sterling silver',
  'how to clean sterling silver earrings',
  'pearl drop earrings silver',
  'silver chanel earrings',
  'silver earring set',
  'silver earrings men',
  'silver earrings teardrop',
  'silver teardrop earrings',
  'silver womens earrings',
  'sterling silver cartilage earrings',
  'sterling silver earring hooks',
  '925 silver earrings',
  '925 sterling silver earring',
  'big silver earrings',
  'black and silver earrings',
  'chunky silver earrings',
  'hammered silver earrings',
  'how to clean silver earrings',
  'kendra scott silver earrings',
  'silver cuff earrings',
  'silver dangling earrings',
  'silver feather earrings',
  'silver leaf earrings',
  'silver necklace and earring set',
  'silver star earrings',
  'sterling silver 925 earrings',
  'sterling silver earrings 925',
  'sterling silver pearl earrings',
  'tiffany silver earrings',
  'amazon silver earrings',
  'bridesmaid earrings silver',

  'gold earrings',
  'golden earring',
  'gold earrings for women',
  '14k gold earrings',
  'rose gold earrings',
  'gold dangle earrings',
  'gold earring',
  'gold nugget earrings',
  'white gold earrings',
  'earrings gold',
  'gold earrings 14k',
  'gold huggie earrings',
  '14kt gold earrings',
  'gold drop earrings',
  'gold earrings for men',
  'gold ouroboros earrings',
  'golden earring twilight zone',
  '14k gold earring',
  'gold earrings women',
  'mens gold earrings',
  'real gold earrings',
  'womens earrings gold',
  '14 karat gold earrings',
  '18k gold earrings',
  '24k gold earrings',
  'gold earrings men',
  'gold heart earrings',
  'gold nugget earring',
  'gold statement earrings',
  'golden earring radar love',
  'golden earrings',
  'earrings gold 14k',
  'gold pearl earrings',
  'gucci earrings gold',
  'men gold earrings',
  'solid gold earrings',
  'chanel earrings gold',
  'gold ball earrings',
  'gold bamboo earrings',
  'gold butterfly earrings',
  'gold chandelier earrings',
  'gold cross earrings',
  'gold pearl drop earrings',
  'gold plated earrings',
  'small gold earrings',
  'white gold earring',
  'white gold earrings for women',
  '10k gold earrings',
  '14 k gold earrings',
  'chunky gold earrings',
  'earrings 14k gold',
  'gold chain earrings',
  'gold clip on earrings',
  'gold nuggets earrings',
  'gold teardrop earrings',
  'gold threader earrings',
  'huggie earrings gold',
  '14k gold huggie earrings',
  '14k white gold earrings',
  'black and gold earrings',
  'dangle gold earrings',
  'dangling gold earrings',
  'girlish gold earrings',
  'gold and pearl earrings',
  'gold bar earrings',
  'gold cartilage earrings',
  'gold earring for men',
  'gold earring set',
  'gold earrings designs for daily use',
  'gold filled earrings',
  'gold flower earrings',
  'gold leaf earrings',
  'gold mens earrings',
  'gold necklace and earring set',
  'gold rose earrings',

  'teardrop diamond earrings',
  'womens diamond earrings',
  '1/4 carat diamond earrings',
  '2 ct diamond earrings',
  '2ct diamond earrings',
  'baguette diamond earrings',
  'black diamond earring',
  'chanel diamond earrings',
  'dangling diamond earrings',
  'diamond and pearl earrings',
  'diamond earring men',
  'diamond necklace and earring set',
  'emerald cut diamond earrings',
  'fake diamond earrings',
  'heart diamond earrings',
  'jcpenney diamond earrings',
  'leverback diamond earrings',
  'men earrings diamond',
  'one carat diamond earrings',

  'hoop earrings',
  'hoop earrings for men',
  'hoop earrings for women',
  'small hoop earrings',
  'pearl hoop earrings',
  'mens hoop earrings',
  'huggie hoop earrings',
  'men hoop earrings',
  'hoops earrings',
  'louis vuitton hoop earrings',
  'lv earrings hoops',
  'lv hoop earrings',
  'big hoop earrings',
  'cartilage hoop earrings',
  'earring hoops',
  'hoop earring',
  'louis vuitton earrings hoops',
  'black hoop earrings',
  'clip on hoop earrings',
  'double hoop earrings',
  'earrings hoops',
  'heart hoop earrings',
  'large hoop earrings',
  'beaded hoop earrings',
  'helix hoop earrings',
  'hoop earrings men',
  'mini hoop earrings',
  'pandora hoop earrings',
  'titanium hoop earrings',
  'cartier hoop earrings',
  'chanel hoop earrings',
  'chunky hoop earrings',
  'conch hoop earring',
  'cross hoop earrings',
  'fendi hoop earrings',
  'hoop earring sizes',
  '14k hoop earrings',
  'dangle hoop earrings',
  'david yurman hoop earrings',
  'girls hoop earrings',
  'mens hoops earrings',
  'mens small hoop earrings',
  'square hoop earrings',
  'stainless steel hoop earrings',
  'swarovski hoop earrings',
  'thick hoop earrings',
  'tiny hoop earrings',
  'turquoise hoop earrings',
  'women’s hoop earrings',
  'womens hoop earrings',
  'bamboo hoop earrings',
  'butterfly hoop earrings',
  'fendi earrings hoops',
  'hoop pearl earrings',
  'kendra scott hoop earrings',
  'male hoop earrings',
  'name hoop earrings',
  'star hoop earrings',
  'tiffany hoop earrings',
  'twisted hoop earrings',
  'charm hoop earrings',
  'designer hoop earrings',
  'drop hoop earrings',
  'gucci hoop earrings',
  'guy hoop earrings',
  'little hoop earrings',
  'mens black hoop earrings',
  'mens hoop earring',
  'mens huggie hoop earrings',
  'michael jordan hoop earring',
  'opal hoop earrings',
  'platinum hoop earrings',
  'rhinestone hoop earrings',
  'star earrings hoop',
  'thin hoop earrings',
  'tory burch hoop earrings',
  'triple hoop earrings',
  'white hoop earrings'
]




    },
    {
      label: 'Watches',
      key: 'watches',
      keywords: [
  'mens watches',
  'mens watch',
  'men watches',
  'watch for men',
  'watches for men',
  'watch men',
  'men’s watches',
  'mens watch brands',
  'best watches for men',
  'best mens watches',
  'nice watches for men',
  'luxury watches for men',
  'luxury mens watches',
  'mens luxury watches',
  'luxury watch men',
  'men luxury watch',
  'men luxury watches',
  'mens watches on sale',

  'rolex watch men',
  'rolex watches for men',
  'mens rolex watch',
  'rolex mens watch',

  'citizen watches for men',
  'citizen mens watches',
  'citizen mens watch',
  'citizen watch mens',
  'mens citizen watch',

  'seiko watches for men',
  'seiko mens watch',

  'invicta watches for men',
  'invicta mens watch',
  'invicta watches men',
  'invicta men watch',
  'invicta watch for men',
  'mens invicta watch',
  'invicta watch mens',

  'movado watch men',
  'movado mens watch',
  'movado watches for men',
  'movado watches men',
  'mens movado watch',

  'bulova watch men',
  'bulova mens watch',
  'bulova men watch',
  'bulova watches for men',

  'fossil watches for men',
  'fossil watch men',
  'mens fossil watch',
  'fossil mens watch',
  'fossil men watch',

  'g shock watches for men',
  'g shock watches men',
  'g shock mens watch',
  'mens g shock watch',

  'tissot watches for men',
  'tissot watches men',
  'tissot mens watch',

  'omega watches men',

  'rado watches for men',

  'versace watch mens',
  'gucci watch men',
  'gucci mens watch',
  'gucci men watch',

  'cartier watch mens',
  'cartier mens watch',
  'cartier men watch',
  'cartier mens watches',

  'michael kors watch men',

  'timex watches for men',

  'garmin watches for men',

  'amazon watches for men',

  'apple watch men',
  'apple watches for men',
  'mens apple watch',
  'apple watch for men',

  'apple watch bands for men',

  'smart watch men',
  'smart watches for men',

  'gold watches for men',
  'gold watch for men',
  'mens gold watch',

  'diamond watches for men',

  'watch brands for men',
  'watches men',

  'watches for women',
  'women watches',
  'women’s watches',
  'watch for women',
  'women watch',
  'watch women',
  'woman watch',
  'best watches for women',
  'luxury watches for women',
  'women’s watch',

  'apple watch bands for women',
  'apple watches for women',
  'apple watch women',
  'apple watches women',
  'women apple watch',
  'women’s apple watch',
  'apple watch for women',
  'apple watch bands women',

  'smart watch women',
  'smart watches for women',
  'women smart watch',

  'rolex watch women',
  'rolex watches for women',
  'rolex women watch',
  'rolex women watches',
  'women rolex watch',

  'cartier watch women',
  'cartier women’s watch',
  'cartier watches for women',

  'gucci watch women',
  'gucci watch for women',
  'gucci watches for women',
  'gucci women watch',

  'michael kors watch women',
  'michael kors watches for women',

  'movado watch women',
  'movado watches for women',
  'movado women watch',
  'movado women’s watch',
  'movado women’s watches',
  'women movado watch',

  'bulova watch women',
  'bulova watches for women',
  'bulova women watch',
  'bulova women’s watch',
  'bulova watches women',

  'fossil watch women',
  'fossil watches for women',
  'fossil watches women',

  'seiko watches for women',

  'citizen watches for women',

  'garmin watches for women',

  'timex watches for women',

  'versace watch women',

  'gold watch women',
  'gold watches for women',

  'diamond watches for women',

  'silver watches for women',

  'designer watches for women',
  'fossil women watches',
  'guess watches for women',
  'invicta watches for women',
  'invicta women watch',
  'movado watches women',
  'rado watches for women',
  'samsung smart watches for women',
  'tag heuer women’s watches',
  'watches for sale for women',
  'watches women',
  'woman watches',
  'women cartier watch',
  'women’s cartier watch',
  'women’s rolex watches',
  'cartier women’s watches',
  'garmin watches women',
  'gucci woman watch',
  'gucci women’s watch',

  'gold watch',
  'gold apple watch band',
  'gold apple watch',
  'gold watches',
  'rose gold apple watch',
  'apple watch gold',
  'apple watch rose gold',
  'casio gold watch',
  'gold casio watch',
  'rolex gold watches',
  'rose gold watch',
  'bulova gold watch',
  'cartier gold watch',
  'gold rolex watch',
  'invicta gold watch',
  'michael kors gold watch',
  'rose gold apple watch band',
  'watch gold',
  'apple watch gold band',
  'citizen gold watch',
  'golden watch',
  'michael kors rose gold watch',
  'movado gold watch',
  'nixon gold watch',
  'seiko gold watch',
  'womens gold watches',
  'gold movado watch',
  'gold pocket watch',
  'gold womens watch',
  'gold bulova watch',
  'gold gucci watch',
  'gold seiko watch',
  'invicta watch gold',
  'omega gold watch',
  'womens gold watch',
  '14k gold watch',
  'apple watch band gold',
  'apple watch se gold',
  'black and gold watch',
  'cartier gold watch womens',
  'fossil gold watch',
  'free gold watch',
  'gold and silver watch',
  'gold citizen watch',
  'gold invicta watch',
  'gold nixon watch',
  'gold stainless steel apple watch',
  'movado gold watch womens',
  'nixon watch gold',
  'rolex watch gold',
  'rose gold watches',
  'solid gold watch',
  'apple watch band rose gold',
  'apple watch rose gold band',
  'casio watch gold',
  'elgin gold watch',
  'gold cartier watch',
  'gold michael kors watch',
  'gold nugget watch',
  'real gold watches',
  'rose gold womens watch',
  'silver and gold apple watch band',
  'silver and gold watch womens',
  'versace gold watch',
  '18k gold watch',
  'apple watch series 7 gold',
  'bulova watch gold',
  'citizen eco drive gold watch',
  'gold apple watch series 7',
  'gold citizens watch',
  'gold diamond watch',
  'gold digital watch',
  'gold invicta watches',
  'gold michele watch',
  'gucci gold watch',
  'ladies gold watch',
  'longines gold watch',
  'michael kors rose gold watch womens',
  'mk rose gold watch',
  'rose gold michael kors watch',
  'vintage gold watch',
  'watch rose gold',
  'white gold watch',
  'cartier tank watch gold',
  'cartier watch gold',
  'citizen watch gold',

  'apple watch straps',
  'apple watch strap',
  'watch straps',
  'watch strap',
  'nato watch strap',
  'leather watch straps',
  'eulit canvas green watch strap',
  'leather strap watches',
  'leather watch strap',
  'nato watch straps',
  'apple watch leather strap',
  'gapless leather strap galaxy watch 4 classic',
  'hirsch watch straps',
  'leather strap watch',
  'rubber watch straps',
  'sailcloth watch strap',
  'barton watch straps',
  'hermes apple watch strap',
  'strap apple watch',
  'watch strap replacement',
  '22mm watch strap',
  'alligator watch strap',
  'apple watch nato strap',
  'canvas watch strap',
  'horus watch straps',
  'leather strap for apple watch',
  'nato strap watches',
  'nylon watch straps',
  'perlon watch strap',
  'rubber watch strap',
  'watch straps leather',
  '18mm watch strap',
  '20mm watch strap',
  'best apple watch straps',
  'best leather watch straps',
  'best watch straps',
  'cartier watch straps',
  'designer apple watch straps',
  'garmin watch straps',
  'hamilton watch straps',
  'horween leather watch strap',
  'omega watch straps',
  'rubber strap watch',
  'samsung watch straps',
  'watch leather strap',
  '18mm strap watch',
  '19mm watch strap',
  '21mm watch strap',
  'apple watch gold strap',
  'best rubber watch straps',
  'bund watch strap',
  'hermes watch strap',
  'nato strap watch',
  'sailcloth watch straps',
  'velcro watch strap',
  'watch straps near me',
  'apple watch gucci strap',
  'apple watch series 7 strap',
  'apple watch ultra straps',
  'artem watch straps',
  'barton watch strap',
  'best nato watch strap',
  'custom watch straps',
  'fossil watch straps',
  'galaxy watch 4 straps',
  'galaxy watch straps',
  'hirsch watch strap',
  'how to change apple watch strap',
  'leather apple watch strap',
  'panerai watch straps',
  'pretty straps apple watch',
  'stingray watch strap',
  'suede watch strap',
  'tropic watch strap',
  'zulu watch strap',
  '17mm watch strap',
  '18mm leather watch strap',
  '20mm leather watch strap',
  'apple watch ankle strap'
]





    },
    {
      label: 'Brooches',
      key: 'brooches',
      keywords: [
  'brooch',
  'brooches',
  'women’s brooch',
  'brooch for women',
  'brooch pin',
  'brooch pins',
  'lapel brooch',
  'lapel pin brooch',
  'flower brooch',
  'floral brooch',
  'vintage brooch',
  'vintage brooches',
  'antique brooch',
  'antique brooches',
  'crystal brooch',
  'crystal brooches',
  'pearl brooch',
  'pearl brooches',
  'gold brooch',
  'silver brooch',
  'diamond brooch',
  'rhinestone brooch',
  'butterfly brooch',
  'bird brooch',
  'bee brooch',
  'animal brooch',
  'animal brooches',
  'wedding brooch',
  'wedding brooches',
  'bridal brooch',
  'bridal brooches',
  'brooch bouquet',
  'brooch for dress',
  'dress brooch',
  'coat brooch',
  'jacket brooch',
  'scarf brooch',
  'hat brooch',
  'christmas brooch',
  'holiday brooch',
  'snowflake brooch',
  'heart brooch',
  'initial brooch',
  'letter brooch',
  'enameled brooch',
  'enameled brooches',
  'fashion brooch',
  'luxury brooch',
  'designer brooch',
  'tiffany brooch',
  'cartier brooch',
  'chanel brooch',
  'chanel brooch pin',
  'brooch pin for saree',
  'saree brooch',
  'brooch for coat',
  'brooch for jacket',
  'brooch for scarf',
  'brooch for wedding',
  'brooch for hat',
  'large brooch',
  'small brooch',
  'statement brooch',
  'statement brooches',
  'unique brooch',
  'unique brooches',
  'vintage rhinestone brooch',
  'vintage flower brooch',
  'vintage pearl brooch',
  'retro brooch',
  'art deco brooch',
  'art deco brooches',
  'victorian brooch',
  'victorian brooches',
  'cameo brooch',
  'cameo brooches',
  'brooch gift',
  'brooch jewelry',
  'brooch accessory'
]

    },
    {
      label: 'Pendants',
      key: 'pendants',
      keywords: [
  'charms',
  'charm',
  'jewelry charms',
  'jewelry charm',
  'bracelet charms',
  'charms for bracelets',
  'charm bracelet',
  'charm bracelets',
  'charm bracelet charms',
  'charm for necklace',
  'charms for necklaces',
  'pendant charm',
  'pendant charms',
  'necklace charm',
  'necklace charms',
  'initial charm',
  'initial charms',
  'letter charm',
  'letter charms',
  'name charms',
  'custom charm',
  'custom charms',
  'personalized charm',
  'personalized charms',
  'birthstone charm',
  'birthstone charms',
  'zodiac charm',
  'zodiac charms',
  'heart charm',
  'heart charms',
  'star charm',
  'star charms',
  'moon charm',
  'moon charms',
  'sun charm',
  'sun charms',
  'flower charm',
  'flower charms',
  'butterfly charm',
  'butterfly charms',
  'bee charm',
  'bee charms',
  'animal charm',
  'animal charms',
  'dog charm',
  'cat charm',
  'paw charm',
  'angel charm',
  'angel wing charm',
  'cross charm',
  'cross charms',
  'religious charm',
  'religious charms',
  'evil eye charm',
  'evil eye charms',
  'hamsa charm',
  'hamsa charms',
  'lock charm',
  'key charm',
  'lock and key charm',
  'infinity charm',
  'infinity charms',
  'pearl charm',
  'pearl charms',
  'crystal charm',
  'crystal charms',
  'diamond charm',
  'diamond charms',
  'gold charm',
  'gold charms',
  'silver charm',
  'silver charms',
  'sterling silver charm',
  'sterling silver charms',
  '14k gold charm',
  '14k gold charms',
  '18k gold charm',
  '18k gold charms',
  'rose gold charm',
  'rose gold charms',
  'enamel charm',
  'enamel charms',
  'glass charm',
  'glass charms',
  'beaded charm',
  'beaded charms',
  'pandora charm',
  'pandora charms',
  'pandora bracelet charms',
  'tiffany charm',
  'tiffany charms',
  'charm set',
  'charm sets',
  'lucky charm',
  'lucky charms jewelry',
  'good luck charm',
  'good luck charms',
  'holiday charm',
  'holiday charms',
  'christmas charm',
  'christmas charms',
  'valentine charm',
  'valentine charms',
  'wedding charm',
  'wedding charms',
  'bridesmaid charm',
  'bridesmaid charms',
  'memorial charm',
  'memorial charms',
  'photo charm',
  'photo charms',
  'locket charm',
  'locket charms',

  'pendant',
  'pendants',
  'pendant necklace',
  'pendant necklaces',
  'necklace pendant',
  'necklace pendants',
  'pendant jewelry',
  'pendant for women',
  'pendants for women',
  'women’s pendant',
  'women’s pendants',
  'pendant for men',
  'mens pendant',
  'mens pendants',

  'gold pendant',
  'gold pendants',
  '14k gold pendant',
  '18k gold pendant',
  'rose gold pendant',
  'white gold pendant',

  'silver pendant',
  'silver pendants',
  'sterling silver pendant',
  '925 silver pendant',

  'diamond pendant',
  'diamond pendants',
  'solitaire pendant',
  'solitaire diamond pendant',

  'gemstone pendant',
  'gemstone pendants',
  'birthstone pendant',
  'birthstone pendants',
  'crystal pendant',
  'crystal pendants',
  'opal pendant',
  'opal pendants',
  'turquoise pendant',
  'turquoise pendants',

  'heart pendant',
  'heart pendants',
  'initial pendant',
  'initial pendants',
  'letter pendant',
  'letter pendants',
  'name pendant',
  'name pendants',
  'personalized pendant',
  'personalized pendants',
  'custom pendant',
  'custom pendants',
  'engraved pendant',
  'engraved pendants',

  'cross pendant',
  'cross pendants',
  'religious pendant',
  'religious pendants',
  'angel pendant',
  'angel wing pendant',
  'hamsa pendant',
  'evil eye pendant',
  'zodiac pendant',
  'zodiac pendants',
  'astrology pendant',

  'butterfly pendant',
  'butterfly pendants',
  'flower pendant',
  'flower pendants',
  'moon pendant',
  'moon pendants',
  'sun pendant',
  'sun pendants',
  'star pendant',
  'star pendants',
  'teardrop pendant',
  'teardrop pendants',

  'pearl pendant',
  'pearl pendants',
  'baroque pearl pendant',

  'locket',
  'lockets',
  'photo locket',
  'heart locket',
  'engraved locket',
  'vintage locket',

  'statement pendant',
  'statement pendants',
  'dainty pendant',
  'dainty pendants',
  'minimalist pendant',
  'minimalist pendants',
  'layered pendant',
  'layered pendants',

  'pendant set',
  'pendant sets',
  'matching pendant',
  'matching pendants',

  'tiffany pendant',
  'tiffany pendants',
  'cartier pendant',
  'cartier pendants',
  'designer pendant',
  'designer pendants',
  'luxury pendant',
  'luxury pendants'
]


    },
     {
      label: 'Just Listed',
      key: 'just listed',
      keywords: [
  'just listed',
  'new arrivals',
  'new jewelry',
  'new items',
  'newly listed',
  'recently listed',
  'recently added',
  'fresh listings',
  'latest jewelry',
  'latest arrivals',
  'new this week',
  'new today',
  'brand new jewelry',
  'new collection',
  'new drop',
  'new release',
  'new jewelry arrivals',
  'new rings',
  'new necklaces',
  'new bracelets',
  'new earrings',
  'new watches',
  'new charms',
  'new brooches',
  'new pendants',
  'new gifts',
  'just added jewelry',
  'just added items',
  'just dropped',
  'just released',
  'new for women',
  'new for men',
  'new for teens',
  'new for couples'
]

    },
     {
      label: 'Body Jewelry',
      key: 'body jewelry',
      keywords: [
  'body jewelry',
  'body piercing jewelry',
  'piercing jewelry',
  'body accessories',
  'body chains',
  'body chain jewelry',
  'body chain necklace',
  'body chain harness',

  'belly ring',
  'belly rings',
  'belly button ring',
  'belly button rings',
  'navel ring',
  'navel rings',
  'belly piercing jewelry',

  'nose ring',
  'nose rings',
  'nose stud',
  'nose studs',
  'nose hoop',
  'nose hoops',
  'nose piercing jewelry',

  'septum ring',
  'septum rings',
  'septum jewelry',
  'septum piercing jewelry',

  'lip ring',
  'lip rings',
  'labret stud',
  'labret jewelry',
  'monroe piercing jewelry',
  'medusa piercing jewelry',

  'eyebrow ring',
  'eyebrow rings',
  'eyebrow piercing jewelry',

  'tongue ring',
  'tongue rings',
  'tongue piercing jewelry',

  'ear piercing jewelry',
  'cartilage earring',
  'cartilage earrings',
  'helix earring',
  'helix earrings',
  'tragus earring',
  'tragus earrings',
  'rook earring',
  'rook earrings',
  'daith earring',
  'daith earrings',
  'conch earring',
  'conch earrings',
  'industrial barbell',
  'industrial piercing jewelry',

  'barbell jewelry',
  'barbell piercing',
  'curved barbell',
  'straight barbell',

  'hoop piercing jewelry',
  'stud piercing jewelry',

  'gold body jewelry',
  'silver body jewelry',
  'sterling silver body jewelry',
  'titanium body jewelry',
  'surgical steel body jewelry',
  '14k gold body jewelry',
  '18k gold body jewelry',

  'gemstone body jewelry',
  'crystal body jewelry',
  'opal body jewelry',
  'diamond body jewelry',

  'butterfly belly ring',
  'heart belly ring',
  'flower belly ring',
  'dangle belly ring',
  'charm belly ring',

  'men’s body jewelry',
  'mens body jewelry',
  'women’s body jewelry',
  'unisex body jewelry',

  'festival body jewelry',
  'boho body jewelry',
  'edgy body jewelry',
  'alternative body jewelry',

  'body jewelry set',
  'body jewelry sets',
  'piercing set',
  'piercing kits',

  'chain nose ring',
  'chain earring',
  'ear cuff',
  'ear cuffs',
  'fake piercing jewelry',
  'clip on body jewelry'
]

     },
     {
      label: 'Toe Rings',
      key: 'toe rings',
      keywords: [
  'toe ring',
  'toe rings',
  'toe ring jewelry',
  'toe ring for women',
  'toe rings for women',
  'women’s toe ring',
  'women’s toe rings',
  'toe ring for men',
  'mens toe ring',
  'mens toe rings',

  'gold toe ring',
  'gold toe rings',
  '14k gold toe ring',
  '18k gold toe ring',
  'rose gold toe ring',
  'white gold toe ring',

  'silver toe ring',
  'silver toe rings',
  'sterling silver toe ring',
  '925 silver toe ring',

  'adjustable toe ring',
  'adjustable toe rings',
  'open toe ring',
  'stackable toe ring',
  'stackable toe rings',
  'dainty toe ring',
  'minimalist toe ring',
  'delicate toe ring',
  'statement toe ring',

  'beach toe ring',
  'summer toe ring',
  'boho toe ring',
  'bohemian toe ring',
  'vacation toe ring',

  'heart toe ring',
  'heart toe rings',
  'butterfly toe ring',
  'butterfly toe rings',
  'flower toe ring',
  'flower toe rings',
  'star toe ring',
  'moon toe ring',
  'sun toe ring',
  'infinity toe ring',
  'evil eye toe ring',
  'hamsa toe ring',

  'gemstone toe ring',
  'gemstone toe rings',
  'birthstone toe ring',
  'birthstone toe rings',
  'crystal toe ring',
  'opal toe ring',
  'turquoise toe ring',
  'diamond toe ring',

  'toe ring set',
  'toe ring sets',
  'matching toe rings',

  'anklet and toe ring set',
  'foot jewelry',
  'barefoot jewelry',
  'foot chain',
  'toe chain ring'
]

     },
     {
      label: 'Metals',
      key: 'metals',
      keywords: [
  'gold',
  'yellow gold',
  'white gold',
  'rose gold',
  'solid gold',
  '14k gold',
  '18k gold',
  '10k gold',
  '24k gold',
  'gold filled',
  'gold plated',
  'gold vermeil',
  'gold over silver',

  'silver',
  'sterling silver',
  '925 silver',
  'fine silver',
  'silver plated',
  'silver tone',

  'platinum',
  '950 platinum',
  'platinum plated',

  'palladium',
  'palladium jewelry',

  'titanium',
  'titanium jewelry',
  'black titanium',
  'titanium plated',

  'tungsten',
  'tungsten carbide',
  'black tungsten',

  'stainless steel',
  'surgical steel',
  '316l stainless steel',
  'stainless steel jewelry',

  'rhodium',
  'rhodium plated',
  'rhodium over silver',

  'brass',
  'brass jewelry',
  'gold tone brass',
  'antique brass',

  'bronze',
  'antique bronze',
  'bronze jewelry',

  'copper',
  'copper jewelry',
  'rose copper',
  'antique copper',

  'nickel free',
  'hypoallergenic metal',
  'allergy safe metal',

  'mixed metal',
  'two tone metal',
  'tri tone metal',

  'metal alloy',
  'fashion metal',
  'costume metal',

  'vermeil',
  'sterling silver vermeil',

  'black metal',
  'gunmetal',
  'oxidized silver',
  'oxidized metal',

  'luxury metals',
  'precious metals',
  'fine metals',

  'men’s metal jewelry',
  'industrial metal jewelry'
]

     },
     {
      label: 'Lockets',
      key: 'lockets',
      keywords: [
  'locket',
  'lockets',
  'locket necklace',
  'locket necklaces',
  'photo locket',
  'photo lockets',
  'picture locket',
  'picture lockets',
  'engraved locket',
  'engraved lockets',
  'custom locket',
  'custom lockets',
  'personalized locket',
  'personalized lockets',
  'name locket',
  'initial locket',
  'initial lockets',
  'letter locket',

  'heart locket',
  'heart lockets',
  'oval locket',
  'round locket',
  'square locket',
  'vintage locket',
  'vintage lockets',
  'antique locket',
  'antique lockets',
  'victorian locket',
  'victorian lockets',
  'cameo locket',
  'cameo lockets',

  'gold locket',
  'gold lockets',
  '14k gold locket',
  '18k gold locket',
  'rose gold locket',
  'white gold locket',

  'silver locket',
  'silver lockets',
  'sterling silver locket',
  '925 silver locket',

  'diamond locket',
  'gemstone locket',
  'birthstone locket',
  'crystal locket',
  'opal locket',

  'locket for women',
  'lockets for women',
  'women’s locket',
  'women’s lockets',
  'locket for men',
  'mens locket',
  'mens lockets',

  'memorial locket',
  'remembrance locket',
  'ashes locket',
  'cremation locket',
  'keepsake locket',
  'sentimental locket',

  'locket pendant',
  'locket pendants',
  'locket charm',
  'locket charms',

  'tiny locket',
  'small locket',
  'mini locket',
  'large locket',
  'statement locket',

  'family locket',
  'mother daughter locket',
  'couples locket',
  'best friend locket',

  'locket gift',
  'locket jewelry',
  'locket with chain',
  'locket set'
]

     },
     {
      label: 'Birthstones',
      key: 'birthstones',
      keywords: [
  'birthstone jewelry',
  'birthstone jewelries',
  'birthstone accessories',
  'birthstone gift',
  'birthstone gifts',
  'birthstone jewelry for women',
  'birthstone jewelry for men',
  'personalized birthstone jewelry',
  'custom birthstone jewelry',
  'engraved birthstone jewelry',
  'family birthstone jewelry',
  'mother birthstone jewelry',
  'mom birthstone jewelry',
  'couples birthstone jewelry',
  'best friend birthstone jewelry',

  'birthstone ring',
  'birthstone rings',
  'birthstone necklace',
  'birthstone necklaces',
  'birthstone pendant',
  'birthstone pendants',
  'birthstone charm',
  'birthstone charms',
  'birthstone bracelet',
  'birthstone bracelets',
  'birthstone earrings',

  'january birthstone',
  'garnet jewelry',
  'garnet ring',
  'garnet necklace',

  'february birthstone',
  'amethyst jewelry',
  'amethyst ring',
  'amethyst necklace',

  'march birthstone',
  'aquamarine jewelry',
  'aquamarine ring',
  'aquamarine necklace',

  'april birthstone',
  'diamond birthstone jewelry',
  'diamond birthstone ring',

  'may birthstone',
  'emerald jewelry',
  'emerald ring',
  'emerald necklace',

  'june birthstone',
  'pearl birthstone jewelry',
  'alexandrite jewelry',

  'july birthstone',
  'ruby jewelry',
  'ruby ring',
  'ruby necklace',

  'august birthstone',
  'peridot jewelry',
  'peridot ring',
  'peridot necklace',

  'september birthstone',
  'sapphire jewelry',
  'sapphire ring',
  'sapphire necklace',

  'october birthstone',
  'opal birthstone jewelry',
  'tourmaline jewelry',

  'november birthstone',
  'citrine jewelry',
  'topaz jewelry',

  'december birthstone',
  'turquoise birthstone jewelry',
  'tanzanite jewelry',
  'blue topaz jewelry',

  'gold birthstone jewelry',
  'silver birthstone jewelry',
  'sterling silver birthstone jewelry',
  'rose gold birthstone jewelry',

  'dainty birthstone jewelry',
  'minimalist birthstone jewelry',
  'statement birthstone jewelry',

  'birthstone jewelry set',
  'birthstone jewelry sets',
  'matching birthstone jewelry',

  'birthstone charm bracelet',
  'birthstone locket',
  'birthstone bar necklace',
  'birthstone stacking rings',

  'january birthstone garnet',
  'garnet ring',
  'garnet necklace',
  'garnet pendant',
  'garnet earrings',
  'garnet bracelet',

  'february birthstone amethyst',
  'amethyst ring',
  'amethyst necklace',
  'amethyst pendant',
  'amethyst earrings',
  'amethyst bracelet',

  'march birthstone aquamarine',
  'aquamarine ring',
  'aquamarine necklace',
  'aquamarine pendant',
  'aquamarine earrings',
  'aquamarine bracelet',

  'april birthstone diamond',
  'diamond ring',
  'diamond necklace',
  'diamond pendant',
  'diamond earrings',
  'diamond bracelet',

  'may birthstone emerald',
  'emerald ring',
  'emerald necklace',
  'emerald pendant',
  'emerald earrings',
  'emerald bracelet',

  'june birthstone pearl',
  'pearl ring',
  'pearl necklace',
  'pearl pendant',
  'pearl earrings',
  'pearl bracelet',
  'alexandrite ring',
  'alexandrite necklace',

  'july birthstone ruby',
  'ruby ring',
  'ruby necklace',
  'ruby pendant',
  'ruby earrings',
  'ruby bracelet',

  'august birthstone peridot',
  'peridot ring',
  'peridot necklace',
  'peridot pendant',
  'peridot earrings',
  'peridot bracelet',

  'september birthstone sapphire',
  'sapphire ring',
  'sapphire necklace',
  'sapphire pendant',
  'sapphire earrings',
  'sapphire bracelet',

  'october birthstone opal',
  'opal ring',
  'opal necklace',
  'opal pendant',
  'opal earrings',
  'opal bracelet',
  'tourmaline ring',
  'tourmaline necklace',

  'november birthstone citrine',
  'citrine ring',
  'citrine necklace',
  'citrine pendant',
  'citrine earrings',
  'citrine bracelet',
  'topaz ring',
  'topaz necklace',

  'december birthstone turquoise',
  'turquoise ring',
  'turquoise necklace',
  'turquoise pendant',
  'turquoise earrings',
  'turquoise bracelet',
  'tanzanite ring',
  'blue topaz ring'
]


     },
     {
      label: 'Anniversary',
      key: 'anniversary',
      keywords: [
  'anniversary jewelry',
  'anniversary gift jewelry',
  'anniversary ring',
  'anniversary rings',
  'anniversary necklace',
  'anniversary necklaces',
  'anniversary bracelet',
  'anniversary bracelets',
  'anniversary earrings',
  'anniversary pendant',
  'anniversary pendants',

  'anniversary jewelry for her',
  'anniversary jewelry for him',
  'mens anniversary jewelry',
  'womens anniversary jewelry',

  'personalized anniversary jewelry',
  'custom anniversary jewelry',
  'engraved anniversary jewelry',
  'initial anniversary necklace',
  'name anniversary necklace',

  'couples anniversary jewelry',
  'matching anniversary jewelry',
  'his and hers anniversary jewelry',

  '1st anniversary jewelry',
  'paper anniversary jewelry',
  'gold dipped jewelry',

  '2nd anniversary jewelry',
  'garnet anniversary jewelry',

  '3rd anniversary jewelry',
  'pearl anniversary jewelry',

  '4th anniversary jewelry',
  'blue topaz anniversary jewelry',

  '5th anniversary jewelry',
  'sapphire anniversary jewelry',

  '6th anniversary jewelry',
  'amethyst anniversary jewelry',

  '7th anniversary jewelry',
  'onyx anniversary jewelry',

  '8th anniversary jewelry',
  'tourmaline anniversary jewelry',

  '9th anniversary jewelry',
  'lapis anniversary jewelry',

  '10th anniversary jewelry',
  'diamond anniversary jewelry',
  'diamond anniversary ring',
  'diamond eternity ring',

  '11th anniversary jewelry',
  'turquoise anniversary jewelry',

  '12th anniversary jewelry',
  'jade anniversary jewelry',

  '13th anniversary jewelry',
  'citrine anniversary jewelry',

  '14th anniversary jewelry',
  'opal anniversary jewelry',

  '15th anniversary jewelry',
  'ruby anniversary jewelry',

  '20th anniversary jewelry',
  'emerald anniversary jewelry',

  '25th anniversary jewelry',
  'silver anniversary jewelry',
  'sterling silver anniversary jewelry',

  '30th anniversary jewelry',
  'pearl anniversary gift',
  'mother of pearl jewelry',

  '40th anniversary jewelry',
  'ruby anniversary ring',
  'ruby anniversary necklace',

  '45th anniversary jewelry',
  'sapphire anniversary ring',

  '50th anniversary jewelry',
  'gold anniversary jewelry',
  'gold anniversary ring',

  '60th anniversary jewelry',
  'diamond anniversary gift',

  'heart anniversary necklace',
  'infinity anniversary necklace',
  'birthstone anniversary jewelry',
  'family anniversary jewelry',
  'locket anniversary gift',

  // 1st Anniversary – Paper / Gold
  '1st anniversary gift',
  'paper anniversary gift',
  'gold dipped jewelry',
  'gold necklace',
  'gold bracelet',
  'gold earrings',

  // 2nd Anniversary – Cotton / Garnet
  '2nd anniversary gift',
  'cotton anniversary gift',
  'garnet jewelry',
  'garnet ring',
  'garnet necklace',

  // 3rd Anniversary – Leather / Pearl
  '3rd anniversary gift',
  'leather anniversary gift',
  'pearl jewelry',
  'pearl necklace',
  'pearl earrings',

  // 4th Anniversary – Fruit/Flowers / Blue Topaz
  '4th anniversary gift',
  'flower anniversary gift',
  'blue topaz jewelry',
  'blue topaz necklace',

  // 5th Anniversary – Wood / Sapphire
  '5th anniversary gift',
  'wood anniversary gift',
  'sapphire jewelry',
  'sapphire ring',

  // 6th Anniversary – Iron / Amethyst
  '6th anniversary gift',
  'iron anniversary gift',
  'amethyst jewelry',
  'amethyst necklace',

  // 7th Anniversary – Copper / Onyx
  '7th anniversary gift',
  'copper anniversary gift',
  'onyx jewelry',
  'onyx ring',

  // 8th Anniversary – Bronze / Tourmaline
  '8th anniversary gift',
  'bronze anniversary gift',
  'tourmaline jewelry',

  // 9th Anniversary – Pottery / Lapis
  '9th anniversary gift',
  'pottery anniversary gift',
  'lapis jewelry',

  // 10th Anniversary – Tin/Aluminum / Diamond
  '10th anniversary gift',
  'diamond anniversary gift',
  'diamond ring',
  'diamond pendant',
  'diamond earrings',

  // 11th Anniversary – Steel / Turquoise
  '11th anniversary gift',
  'steel anniversary gift',
  'turquoise jewelry',

  // 12th Anniversary – Silk / Jade
  '12th anniversary gift',
  'silk anniversary gift',
  'jade jewelry',

  // 13th Anniversary – Lace / Citrine
  '13th anniversary gift',
  'lace anniversary gift',
  'citrine jewelry',

  // 14th Anniversary – Ivory (modern: Gold) / Opal
  '14th anniversary gift',
  'opal jewelry',
  'opal necklace',

  // 15th Anniversary – Crystal / Ruby
  '15th anniversary gift',
  'crystal anniversary gift',
  'ruby jewelry',

  // 20th Anniversary – China / Emerald
  '20th anniversary gift',
  'emerald jewelry',
  'emerald ring',

  // 25th Anniversary – Silver
  '25th anniversary gift',
  'silver anniversary gift',
  'sterling silver jewelry',

  // 30th Anniversary – Pearl
  '30th anniversary gift',
  'pearl anniversary gift',
  'mother of pearl jewelry',

  // 40th Anniversary – Ruby
  '40th anniversary gift',
  'ruby anniversary gift',
  'ruby necklace',

  // 45th Anniversary – Sapphire
  '45th anniversary gift',
  'sapphire anniversary gift',

  // 50th Anniversary – Gold
  '50th anniversary gift',
  'gold anniversary gift',
  'gold ring',

  // 60th Anniversary – Diamond
  '60th anniversary gift',
  'diamond anniversary jewelry',

  // 1st Anniversary – Paper / Gold
  '1st anniversary gift',
  'paper anniversary gift',
  'gold anniversary jewelry',
  'gold necklace',
  'gold bracelet',
  'gold earrings',
  'gold ring',

  // 2nd Anniversary – Cotton / Garnet
  '2nd anniversary gift',
  'cotton anniversary gift',
  'garnet anniversary jewelry',
  'garnet ring',
  'garnet necklace',
  'garnet earrings',

  // 3rd Anniversary – Leather / Pearl
  '3rd anniversary gift',
  'leather anniversary gift',
  'pearl anniversary jewelry',
  'pearl necklace',
  'pearl earrings',
  'pearl bracelet',

  // 4th Anniversary – Fruit/Flowers / Blue Topaz
  '4th anniversary gift',
  'flower anniversary gift',
  'blue topaz anniversary jewelry',
  'blue topaz necklace',
  'blue topaz ring',

  // 5th Anniversary – Wood / Sapphire
  '5th anniversary gift',
  'wood anniversary gift',
  'sapphire anniversary jewelry',
  'sapphire ring',
  'sapphire necklace',

  // 6th Anniversary – Iron / Amethyst
  '6th anniversary gift',
  'iron anniversary gift',
  'amethyst anniversary jewelry',
  'amethyst necklace',
  'amethyst ring',

  // 7th Anniversary – Copper / Onyx
  '7th anniversary gift',
  'copper anniversary gift',
  'onyx anniversary jewelry',
  'onyx ring',
  'onyx necklace',

  // 8th Anniversary – Bronze / Tourmaline
  '8th anniversary gift',
  'bronze anniversary gift',
  'tourmaline anniversary jewelry',
  'tourmaline necklace',

  // 9th Anniversary – Pottery / Lapis
  '9th anniversary gift',
  'pottery anniversary gift',
  'lapis anniversary jewelry',
  'lapis necklace',

  // 10th Anniversary – Tin/Aluminum / Diamond
  '10th anniversary gift',
  'diamond anniversary jewelry',
  'diamond ring',
  'diamond pendant',
  'diamond earrings',

  // 11th Anniversary – Steel / Turquoise
  '11th anniversary gift',
  'steel anniversary gift',
  'turquoise anniversary jewelry',
  'turquoise necklace',

  // 12th Anniversary – Silk / Jade
  '12th anniversary gift',
  'silk anniversary gift',
  'jade anniversary jewelry',
  'jade pendant',

  // 13th Anniversary – Lace / Citrine
  '13th anniversary gift',
  'lace anniversary gift',
  'citrine anniversary jewelry',
  'citrine necklace',

  // 14th Anniversary – Ivory (modern: Gold) / Opal
  '14th anniversary gift',
  'opal anniversary jewelry',
  'opal necklace',
  'opal ring',

  // 15th Anniversary – Crystal / Ruby
  '15th anniversary gift',
  'crystal anniversary gift',
  'ruby anniversary jewelry',
  'ruby necklace',
  'ruby ring',

  // 20th Anniversary – China / Emerald
  '20th anniversary gift',
  'emerald anniversary jewelry',
  'emerald ring',
  'emerald necklace',

  // 25th Anniversary – Silver
  '25th anniversary gift',
  'silver anniversary jewelry',
  'sterling silver necklace',
  'sterling silver bracelet',

  // 30th Anniversary – Pearl
  '30th anniversary gift',
  'pearl anniversary jewelry',
  'mother of pearl jewelry',

  // 40th Anniversary – Ruby
  '40th anniversary gift',
  'ruby anniversary gift',
  'ruby necklace',

  // 45th Anniversary – Sapphire
  '45th anniversary gift',
  'sapphire anniversary gift',

  // 50th Anniversary – Gold
  '50th anniversary gift',
  'gold anniversary gift',
  'gold ring',
  'gold pendant',

  // 60th Anniversary – Diamond
  '60th anniversary gift',
  'diamond anniversary gift',
  'diamond jewelry set',

  'anniversary gifts for her',
  'anniversary jewelry for her',
  'romantic anniversary gifts for her',
  'personalized anniversary gifts for her',
  'custom anniversary gifts for her',
  'engraved anniversary gifts for her',
  'anniversary necklace for her',
  'anniversary ring for her',
  'anniversary bracelet for her',
  'anniversary earrings for her',
  'anniversary pendant for her',
  'diamond anniversary gift for her',
  'gold anniversary gift for her',
  'silver anniversary gift for her',
  'rose gold anniversary gift for her',
  'birthstone anniversary gift for her',
  'initial necklace for her',
  'name necklace for her',
  'heart necklace for her',
  'infinity necklace for her',
  'locket for her',
  'photo locket for her',
  'pearl anniversary gift for her',
  'sapphire anniversary gift for her',
  'ruby anniversary gift for her',
  'emerald anniversary gift for her',
  'opal anniversary gift for her',
  'diamond eternity ring for her',
  'matching couples jewelry for her',
  'sentimental anniversary gift for her',
  'luxury anniversary gift for her',
  'unique anniversary gift for her',

  'anniversary gifts for him',
  'anniversary jewelry for him',
  'romantic anniversary gifts for him',
  'personalized anniversary gifts for him',
  'custom anniversary gifts for him',
  'engraved anniversary gifts for him',
  'mens anniversary ring',
  'mens anniversary bracelet',
  'mens anniversary necklace',
  'mens pendant necklace',
  'mens chain necklace',
  'mens signet ring',
  'mens birthstone ring',
  'mens gemstone bracelet',
  'mens leather bracelet',
  'mens beaded bracelet',
  'mens cuff bracelet',
  'mens watch anniversary gift',
  'gold anniversary gift for him',
  'silver anniversary gift for him',
  'titanium anniversary gift for him',
  'stainless steel anniversary gift for him',
  'black onyx anniversary gift for him',
  'turquoise anniversary gift for him',
  'matching couples jewelry for him',
  'minimalist anniversary gift for him',
  'unique anniversary gift for him',

  'anniversary gifts for wife',
  'anniversary jewelry for wife',
  'romantic anniversary gifts for wife',
  'personalized anniversary gifts for wife',
  'custom anniversary gifts for wife',
  'engraved anniversary gifts for wife',
  'anniversary necklace for wife',
  'anniversary ring for wife',
  'anniversary bracelet for wife',
  'anniversary earrings for wife',
  'diamond anniversary gift for wife',
  'gold anniversary gift for wife',
  'silver anniversary gift for wife',
  'rose gold anniversary gift for wife',
  'birthstone anniversary gift for wife',
  'heart necklace for wife',
  'infinity necklace for wife',
  'locket for wife',
  'photo locket for wife',
  'pearl anniversary gift for wife',
  'sapphire anniversary gift for wife',
  'ruby anniversary gift for wife',
  'emerald anniversary gift for wife',
  'opal anniversary gift for wife',
  'diamond eternity ring for wife',
  'luxury anniversary gift for wife',
  'sentimental anniversary gift for wife',
  'unique anniversary gift for wife',

  'anniversary gifts for husband',
  'anniversary jewelry for husband',
  'romantic anniversary gifts for husband',
  'personalized anniversary gifts for husband',
  'custom anniversary gifts for husband',
  'engraved anniversary gifts for husband',
  'mens anniversary ring',
  'mens signet ring',
  'mens chain necklace',
  'mens pendant necklace',
  'mens bracelet anniversary gift',
  'mens leather bracelet',
  'mens cuff bracelet',
  'mens beaded bracelet',
  'mens watch anniversary gift',
  'gold anniversary gift for husband',
  'silver anniversary gift for husband',
  'titanium anniversary gift for husband',
  'stainless steel anniversary gift for husband',
  'black onyx anniversary gift for husband',
  'turquoise anniversary gift for husband',
  'minimalist anniversary gift for husband',
  'unique anniversary gift for husband',

  'anniversary gifts for girlfriend',
  'anniversary jewelry for girlfriend',
  'romantic anniversary gifts for girlfriend',
  'cute anniversary gifts for girlfriend',
  'personalized anniversary gifts for girlfriend',
  'custom anniversary gifts for girlfriend',
  'engraved anniversary gifts for girlfriend',
  'anniversary necklace for girlfriend',
  'heart necklace for girlfriend',
  'initial necklace for girlfriend',
  'name necklace for girlfriend',
  'birthstone necklace for girlfriend',
  'promise ring for girlfriend',
  'anniversary bracelet for girlfriend',
  'anniversary earrings for girlfriend',
  'photo locket for girlfriend',
  'rose gold jewelry for girlfriend',
  'pearl jewelry for girlfriend',
  'sapphire jewelry for girlfriend',
  'unique anniversary gift for girlfriend',
  'sentimental anniversary gift for girlfriend',

  'anniversary gifts for boyfriend',
  'anniversary jewelry for boyfriend',
  'romantic anniversary gifts for boyfriend',
  'personalized anniversary gifts for boyfriend',
  'custom anniversary gifts for boyfriend',
  'engraved anniversary gifts for boyfriend',
  'mens chain necklace',
  'mens pendant necklace',
  'mens bracelet anniversary gift',
  'mens leather bracelet',
  'mens beaded bracelet',
  'mens cuff bracelet',
  'mens ring anniversary gift',
  'mens signet ring',
  'mens watch anniversary gift',
  'titanium jewelry for boyfriend',
  'stainless steel jewelry for boyfriend',
  'black onyx jewelry for boyfriend',
  'minimalist anniversary gift for boyfriend',
  'unique anniversary gift for boyfriend',

  // 1st – Paper / Gold
  '1st anniversary gift',
  'paper anniversary gift',
  'gold anniversary jewelry',

  // 2nd – Cotton / Garnet
  '2nd anniversary gift',
  'cotton anniversary gift',
  'garnet anniversary jewelry',

  // 3rd – Leather / Pearl
  '3rd anniversary gift',
  'leather anniversary gift',
  'pearl anniversary jewelry',

  // 4th – Fruit/Flowers / Blue Topaz
  '4th anniversary gift',
  'flower anniversary gift',
  'blue topaz anniversary jewelry',

  // 5th – Wood / Sapphire
  '5th anniversary gift',
  'wood anniversary gift',
  'sapphire anniversary jewelry',

  // 6th – Iron / Amethyst
  '6th anniversary gift',
  'iron anniversary gift',
  'amethyst anniversary jewelry',

  // 7th – Copper / Onyx
  '7th anniversary gift',
  'copper anniversary gift',
  'onyx anniversary jewelry',

  // 8th – Bronze / Tourmaline
  '8th anniversary gift',
  'bronze anniversary gift',
  'tourmaline anniversary jewelry',

  // 9th – Pottery / Lapis
  '9th anniversary gift',
  'pottery anniversary gift',
  'lapis anniversary jewelry',

  // 10th – Tin/Aluminum / Diamond
  '10th anniversary gift',
  'tin anniversary gift',
  'diamond anniversary jewelry',

  // 11th – Steel / Turquoise
  '11th anniversary gift',
  'steel anniversary gift',
  'turquoise anniversary jewelry',

  // 12th – Silk / Jade
  '12th anniversary gift',
  'silk anniversary gift',
  'jade anniversary jewelry',

  // 13th – Lace / Citrine
  '13th anniversary gift',
  'lace anniversary gift',
  'citrine anniversary jewelry',

  // 14th – Ivory (modern: Gold) / Opal
  '14th anniversary gift',
  'gold anniversary gift',
  'opal anniversary jewelry',

  // 15th – Crystal / Ruby
  '15th anniversary gift',
  'crystal anniversary gift',
  'ruby anniversary jewelry',

  // 16th – Wax / Peridot
  '16th anniversary gift',
  'wax anniversary gift',
  'peridot anniversary jewelry',

  // 17th – Furniture / Carnelian
  '17th anniversary gift',
  'furniture anniversary gift',
  'carnelian anniversary jewelry',

  // 18th – Porcelain / Cat’s Eye
  '18th anniversary gift',
  'porcelain anniversary gift',
  'cats eye anniversary jewelry',

  // 19th – Bronze / Aquamarine
  '19th anniversary gift',
  'bronze anniversary gift',
  'aquamarine anniversary jewelry',

  // 20th – China / Emerald
  '20th anniversary gift',
  'china anniversary gift',
  'emerald anniversary jewelry',

  // 25th – Silver
  '25th anniversary gift',
  'silver anniversary gift',
  'sterling silver anniversary jewelry',

  // 30th – Pearl
  '30th anniversary gift',
  'pearl anniversary gift',
  'mother of pearl jewelry',

  // 35th – Coral / Jade
  '35th anniversary gift',
  'coral anniversary gift',
  'jade anniversary jewelry',

  // 40th – Ruby
  '40th anniversary gift',
  'ruby anniversary gift',
  'ruby anniversary jewelry',

  // 45th – Sapphire
  '45th anniversary gift',
  'sapphire anniversary gift',
  'sapphire anniversary jewelry',

  // 50th – Gold
  '50th anniversary gift',
  'gold anniversary gift',
  'gold anniversary jewelry',

  // 55th – Emerald
  '55th anniversary gift',
  'emerald anniversary gift',

  // 60th – Diamond
  '60th anniversary gift',
  'diamond anniversary gift',
  'diamond anniversary jewelry'
]










     },
     {
      label: 'Anklets',
      key: 'anklets',
      keywords: []
     },
     {
      label: 'Anklets',
      key: 'anklets',
      keywords: []
     },
     {
      label: 'Anklets',
      key: 'anklets',
      keywords: []
     },
     {
      label: 'Anklets',
      key: 'anklets',
      keywords: []
     },
    {
      label: 'Anklets',
      key: 'anklets',
      keywords: [
  'anklet',
  'anklets',
  'anklet bracelet',
  'ankle bracelet',
  'ankle bracelets',
  'anklet jewelry',
  'anklet for women',
  'anklets for women',
  'women’s anklet',
  'women’s anklets',
  'anklet for men',
  'mens anklet',
  'mens anklets',

  'gold anklet',
  'gold anklets',
  '14k gold anklet',
  '18k gold anklet',
  'rose gold anklet',
  'white gold anklet',

  'silver anklet',
  'silver anklets',
  'sterling silver anklet',
  '925 silver anklet',

  'chain anklet',
  'chain anklets',
  'thin chain anklet',
  'paperclip anklet',
  'cuban link anklet',
  'rope chain anklet',

  'beaded anklet',
  'beaded anklets',
  'beach anklet',
  'boho anklet',
  'bohemian anklet',
  'summer anklet',
  'vacation anklet',

  'charm anklet',
  'charm anklets',
  'heart anklet',
  'heart anklets',
  'butterfly anklet',
  'butterfly anklets',
  'star anklet',
  'moon anklet',
  'sun anklet',
  'evil eye anklet',
  'hamsa anklet',
  'infinity anklet',
  'initial anklet',
  'letter anklet',
  'name anklet',
  'personalized anklet',
  'custom anklet',

  'pearl anklet',
  'pearl anklets',
  'crystal anklet',
  'gemstone anklet',
  'birthstone anklet',

  'anklet set',
  'anklet sets',
  'layered anklet',
  'layered anklets',
  'double anklet',
  'triple anklet',

  'dainty anklet',
  'delicate anklet',
  'minimalist anklet',
  'statement anklet',

  'adjustable anklet',
  'waterproof anklet',
  'stretch anklet',
  'anklet with charms',
  'anklet with bells',
  'anklet with stones',

  'anklet for teens',
  'anklet for girls',
  'anklet gift',
  'anklet for beach',
  'anklet for summer'
]

    },
  {
      label: 'Trending Now',
      key: 'trending now',
      keywords: [
  'trending jewelry',
  'trending now',
  'trending items',
  'trending accessories',
  'popular jewelry',
  'popular items',
  'viral jewelry',
  'viral items',
  'hot jewelry',
  'hot items',
  'best sellers',
  'best selling jewelry',
  'top rated jewelry',
  'top trending jewelry',
  'fashion trending jewelry',
  'jewelry trends',
  'latest jewelry trends',
  'new trending jewelry',
  'must have jewelry',
  'jewelry everyone is buying',
  'jewelry going viral',
  'jewelry in style',
  'jewelry in fashion',
  'on trend jewelry',
  'trending necklaces',
  'trending rings',
  'trending bracelets',
  'trending earrings',
  'trending watches',
  'trending charms',
  'trending brooches',
  'trending pendants',
  'trending gifts',
  'trending for women',
  'trending for men',
  'trending for teens',
  'trending for couples'
]

    },
  ],
},

  {
    label: 'Marketplace',
    items: [
      { label: 'Shop', key: 'shop' },
      { label: 'Sell', key: 'sell' },
    ],
  },
  {
    label: 'Goat Certified',
    items: [
      { label: "Watch Appraisal", key: 'watch-appraisal' },
      { label: "Diamond Appraisal", key: 'diamond-appraisal' },
      { label: 'Trending', key: 'trending' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Reviews', key: 'reviews' },
      { label: 'Rewards', key: 'rewards' },
    ],
  },
];

export const HEADER_MAX_HEIGHT = 110;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const showAlert = true; // or derive from props, state, or context
const birthstones: Birthstone[] = [
  { month: 'January', stone: 'Garnet', color: '#8B0000', meaning: 'Deep red warmth, like a goat’s heartbeat in winter' },
  { month: 'February', stone: 'Amethyst', color: '#800080', meaning: 'Mystical purple, perfect for twilight bidding' },
  { month: 'March', stone: 'Aquamarine', color: '#7FFFD4', meaning: 'Ocean breeze meets barnyard calm' },
  { month: 'April', stone: 'Quartz', color: '#E0E0E0', meaning: 'Clean and crisp, like a fresh modal invocation' },
  { month: 'May', stone: 'Emerald', color: '#50C878', meaning: 'Lush green, like springtime goat whispers' },
  { month: 'June', stone: 'Pearl', color: '#dcdcdc', meaning: 'Soft shimmer, now visible against white tiles' },
  { month: 'July', stone: 'Ruby', color: '#E0115F', meaning: 'Bold and celebratory, like a winning bid' },
  { month: 'August', stone: 'Peridot', color: '#B4EEB4', meaning: 'Playful green with a hint of summer mischief' },
  { month: 'September', stone: 'Sapphire', color: '#0F52BA', meaning: 'Royal blue for confident contributors' },
  { month: 'October', stone: 'Opal', color: '#FFB6C1', meaning: 'Pastel magic with unpredictable sparkle trails' },
  { month: 'November', stone: 'Topaz', color: '#FFC87C', meaning: 'Golden warmth for cozy barnyard rituals' },
  { month: 'December', stone: 'Turquoise', color: '#40E0D0', meaning: 'Frosty teal for wintertime lore' },
];

const EnhancedHeader: React.FC<HeaderProps> = ({
  scrollY,
  username: usernameProp = null,
  avatarUrl = null,
  onSearch,
   onSelect,
                                               }) => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showBirthstoneModal, setShowBirthstoneModal] = useState(false);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [username, setUsername] = useState<string | null>(usernameProp);
  const [sellingExpanded, setSellingExpanded] = useState(false);
  const [buyingExpanded, setBuyingExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const [modalSearchText, setModalSearchText] = useState(''); // Separate state for modal search
  const [availableStrategies] = useState<Array<{name: string, icon: string, description: string}>>([
    { name: 'Buy It Now', icon: '🛒', description: 'Purchase instantly at fixed price' },
    { name: 'Must Sell', icon: '🔥', description: 'Fast auctions with urgent sales' },
    { name: 'Regular Auctions', icon: '⚡', description: 'Classic bidding wars' },
    { name: 'Price Dropped', icon: '📉', description: 'Recently reduced listings' },
  ]);




  const baseY = useMemo(() => scrollY ?? new Animated.Value(0), [scrollY]);
  // Fixed header height - no animation to prevent banding
  const headerHeight = HEADER_MAX_HEIGHT;
  const opacity = baseY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE], outputRange: [1, 1], extrapolate: 'clamp'
  });

  // Handle favorite toggle in dropdown
  const handleHeartPress = async (itemId: number) => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) return;

      const isFavorited = favorites[itemId];

      if (!isFavorited) {
        await fetch(`${API_BASE_URL}/api/favorites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ item_id: itemId }),
        });

        // Navigate to favorites screen after adding
        router.push('/JewelryBoxScreen');
      } else {
        await fetch(`${API_BASE_URL}/api/favorites/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      setFavorites(prev => ({ ...prev, [itemId]: !prev[itemId] }));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };


  const handleGiftNavigation = (occasion: string) => {
    if (occasion === 'birthday') {
      setShowGiftModal(false);
      setShowBirthstoneModal(true);
    } else {
      router.push(`/gift-finder/${occasion}`);
      setShowGiftModal(false);
    }
  };

  const handleBirthstonePress = (month: string, stone: string, meaning: string) => {
    Alert.alert(`💎 ${stone} Radiance`, `The Goat Oracle says: ${meaning} shines brightest in ${month}!`);
  };

  // Search function - route to appropriate screen based on strategy
  const performElasticsearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    // Route to different screens based on selected strategy
    if (selectedCategory === 'Buy It Now') {
      // Navigate to explore screen (Sell Now tab) with search query
      router.push(`/(tabs)/explore?search=${encodeURIComponent(query)}`);
    } else if (selectedCategory === 'Must Sell') {
      // Navigate to home/index with search query (Just Listed shows must sell items)
      router.push(`/(tabs)/?search=${encodeURIComponent(query)}`);
    } else if (selectedCategory === 'Regular Auctions') {
      // Navigate to home/index with search query for regular auctions
      router.push(`/(tabs)/?search=${encodeURIComponent(query)}&type=auction`);
    } else if (selectedCategory === 'Price Dropped') {
      // Navigate to relisted discounts screen with search query
      router.push(`/relisted-discounts?search=${encodeURIComponent(query)}`);
    } else {
      // All Categories - use generic search screen
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // Load user's favorites and available categories on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = await AsyncStorage.getItem('jwtToken');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const favoritesMap: Record<number, boolean> = {};

          // Create a map of item_id -> true for quick lookups
          if (data.favorites && Array.isArray(data.favorites)) {
            data.favorites.forEach((fav: any) => {
              favoritesMap[fav.item_id] = true;
            });
          }

          setFavorites(favoritesMap);
          console.log('🐐 Loaded favorites:', Object.keys(favoritesMap).length);
        }
      } catch (err) {
        console.error('🐐 Failed to load favorites:', err);
      }
    };

    // Removed loadCategories - now using hardcoded strategies instead of dynamic categories
    // const loadCategories = async () => { ... };

    loadFavorites();
  }, []);

  // No auto-search - user must press Enter or tap search button to search

  // Fetch unread notification count and notifications
  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.log('🐐 [Notifications] No token found, skipping fetch');
        return;
      }

      console.log('🐐 [Notifications] Fetching notifications from:', API_BASE_URL);

      // Fetch both count and full notifications
      let countResponse, notificationsResponse;
      try {
        [countResponse, notificationsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${API_BASE_URL}/api/notifications`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);
      } catch (fetchError) {
        console.error('🐐 [Notifications] Fetch error:', fetchError);
        return;
      }

      console.log('🐐 [Notifications] Count response status:', countResponse.status);
      console.log('🐐 [Notifications] Full notifications response status:', notificationsResponse.status);

      if (countResponse.ok) {
        const data = await countResponse.json();
        console.log('🐐 [Notifications] Unread count:', data.unread_count || 0);
        setUnreadCount(data.unread_count || 0);
      } else {
        const errorText = await countResponse.text();
        console.error('🐐 [Notifications] Count endpoint failed:', errorText);
      }

      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        console.log('🐐 [Notifications] Total notifications received:', data.notifications?.length || 0);
        // Filter to unread notifications only
        const unreadNotifications = (data.notifications || []).filter((n: any) => !n.is_read);
        console.log('🐐 [Notifications] Unread notifications:', unreadNotifications.length);
        console.log('🐐 [Notifications] Unread notification data:', JSON.stringify(unreadNotifications, null, 2));
        setNotifications(unreadNotifications);
      } else {
        const errorText = await notificationsResponse.text();
        console.error('🐐 [Notifications] Notifications endpoint failed:', errorText);
      }
    } catch (error) {
      console.error('🐐 [Notifications] Error fetching notifications:', error);
    }
  };

  // Check AsyncStorage for username and avatar on mount and when menu opens
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const token = await AsyncStorage.getItem('jwtToken');
        const storedAvatar = await AsyncStorage.getItem('avatar_url');

        console.log('🐐 EnhancedHeader checkAuth - storedAvatar:', storedAvatar);

        if (storedUsername && token) {
          setUsername(storedUsername);

          // Set user's actual avatar if available
          if (storedAvatar && storedAvatar.startsWith('http')) {
            setAvatar(storedAvatar);
            console.log('🐐 EnhancedHeader - Avatar set to:', storedAvatar);
          } else {
            setAvatar('');
            console.log('🐐 EnhancedHeader - No valid avatar, set to empty');
          }

          // Fetch unread notifications count
          fetchUnreadCount();

          // Check if token is expired
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const expiry = payload.exp * 1000; // Convert to milliseconds
              const now = Date.now();

              if (expiry < now) {
                console.log('🐐 Token expired, showing modal');
                setShowTokenExpiredModal(true);
              }
            }
          } catch (e) {
            console.warn('🐐 Could not parse token expiry:', e);
          }
        } else {
          setUsername(null);
          setAvatar(''); // Reset to empty for guests (will show goat icon)
        }
      } catch (error) {
        console.error('🐐 Error checking auth:', error);
        setUsername(null);
        setAvatar(''); // Reset to empty (will show goat icon)
      }
    };

    checkAuth();

    // Re-check when menu opens (to catch sign-ins that happened)
    if (showMenu) {
      checkAuth();
    }

    // Poll for notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [showMenu]);

  useEffect(() => {
  if (!scrollY?.addListener) return;

  const listener = scrollY.addListener(({ value }) => {
    console.log('🐐 scrollY:', value);
  });
  return () => scrollY.removeListener(listener);
}, [scrollY]);

  // Use avatar from state (which loads from AsyncStorage) or prop, fallback to empty
  // Priority: avatarUrl prop > avatar state > empty (which will show goat icon in BidGoatMenuModal)
  const img = useMemo(() => {
    if (avatarUrl?.startsWith('http')) {
      return avatarUrl;
    }
    if (avatar && avatar.startsWith('http')) {
      return avatar;
    }
    return ''; // Empty string will trigger goat-icon.png fallback in Avatar component
  }, [avatarUrl, avatar]);

  const { cartItems } = useCartBackend();

  // Log when menu opens
  useEffect(() => {
    if (showMenu) {
      console.log('🐐 EnhancedHeader passing to modal - username:', username, 'avatarUrl:', img);
    }
  }, [showMenu, username, img]);

 return (
  <Animated.View
    style={[
      styles.container,
      {
        paddingTop: Platform.OS === 'web' ? 30 : insets.top,
        opacity,
        width: '100%',
        backgroundColor: colors.background,
        ...(showAlert ? {
          backgroundColor: colors.background,
        } : {}),
      },
    ]}
  >
    <Animated.View style={[styles.header, { height: headerHeight, backgroundColor: colors.background, borderColor: theme === 'dark' ? '#333' : '#ddd' }]}>
      {/* Icons Row - Above Search */}
      <View style={styles.iconsRow}>
        {/* BidGoat Logo Text */}
        <TouchableOpacity onPress={() => router.push('/(tabs)')} style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.logoBid}>Bid</Text>
            <Text style={styles.logoGoat}>Goat</Text>
          </Text>
        </TouchableOpacity>

        {/* Spacer to push icons to the right */}
        <View style={{ flex: 1 }} />

        {/* Cart Icon with Badge */}
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconButton}>
          <View style={styles.cartContainer}>
            <Ionicons name="cart" size={24} color={colors.textPrimary} />
            {cartItems.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItems.length}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Notification Bell Icon */}
        <TouchableOpacity
          onPress={() => {
            router.push('/notifications');
            setUnreadCount(0); // Reset count when user opens notifications
            setNotifications([]); // Clear notifications
          }}
          style={styles.iconButton}
        >
          <EnhancedNotificationBell
            badgeConfig={getNotificationBadgeConfig(notifications)}
            size={26}
          />
        </TouchableOpacity>

        {/* Profile Icon */}
        <TouchableOpacity
          onPress={() => {
            if (username) {
              router.push('/(tabs)/profile');
            } else {
              router.push('/sign-in');
            }
          }}
          style={styles.iconButton}
        >
          <Ionicons
            name={username ? "person" : "person-outline"}
            size={28}
            color={username ? "#6A0DAD" : colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Menu Icon */}
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.iconButton}>
          <Ionicons name="menu" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* eBay-Style Search Row - Full Width */}
      <View style={styles.searchRow}>
        <View style={[styles.ebaySearchContainer, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff', borderColor: theme === 'dark' ? '#3C3C3E' : '#3665f3' }]}>
          {/* Category Dropdown */}
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.categoryText, { color: colors.textPrimary }]} numberOfLines={1}>
              {selectedCategory}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={[styles.searchDivider, { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#e5e5e5' }]} />

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search for anything..."
              placeholderTextColor={theme === 'dark' ? '#999' : '#999'}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => {
                if (searchText.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchText.trim())}&category=${selectedCategory}`);
                }
              }}
              returnKeyType="search"
            />
            {searchText.length > 0 && !isSearching && (
              <TouchableOpacity onPress={() => { setSearchText(''); setResults([]); }}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search Button - eBay Blue */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              if (searchText.trim()) {
                router.push(`/search?q=${encodeURIComponent(searchText.trim())}&category=${selectedCategory}`);
              }
            }}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

  {/* Dropdown results - Now using ElasticsearchResultCard */}
  {results.length > 0 && (
    <View style={styles.dropdown}>
      <View style={styles.dropdownHeader}>
        <Text style={styles.dropdownTitle}>Search Results ({results.length})</Text>
        <TouchableOpacity onPress={() => { setResults([]); setSearchText(''); }}>
          <Text style={styles.dropdownClose}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={true}>
        {results.map((item) => (
          <View key={item.item_id} style={{ marginBottom: 8 }}>
            <ElasticsearchResultCard
              item={item}
              onPress={(itemId) => {
                router.push(`/item/${itemId}`);
                setSearchText('');
                setResults([]);
              }}
              onHeartPress={handleHeartPress}
              isFavorited={favorites[item.item_id]}
              showRelevanceScore={false}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  )}

    </Animated.View>

    {/* Main Menu Modal - New BidGoatMenuModal */}
    <BidGoatMenuModal
      visible={showMenu}
      onClose={() => setShowMenu(false)}
      username={username}
      avatarUrl={img}
      onGiftFinderPress={() => setShowGiftModal(true)}
    />

    {/* Gift Discovery Modal - New Enhanced Version */}
    <GiftDiscoveryModal visible={showGiftModal} onClose={() => setShowGiftModal(false)} />


    {/* Selling Strategy Modal - Redesigned */}
    <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCategoryModal(false)} />
        <View style={[styles.categoryModalContent, { backgroundColor: colors.background }]}>
          {/* Drag Handle */}
          <View style={[styles.dragHandle, { backgroundColor: theme === 'dark' ? '#3C3C3E' : '#CBD5E0' }]} />

          <View style={[styles.categoryModalHeaderRow, { paddingTop: 8, paddingHorizontal: 20 }]}>
            <View>
              <Text style={[styles.modalHeader, { color: colors.textPrimary }]}>Browse by Strategy</Text>
              <Text style={[styles.modalSubheader, { color: colors.textSecondary }]}>Find deals your way</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 20, paddingTop: 16 }}>
            {/* All Listings Option */}
            <TouchableOpacity
              style={[
                styles.strategyCard,
                {
                  backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff',
                  borderColor: theme === 'dark' ? '#2C2C2E' : '#E5E7EB',
                }
              ]}
              onPress={() => {
                setShowCategoryModal(false);
                router.push('/(tabs)/');
              }}
            >
              <View style={styles.strategyIconContainer}>
                <Text style={styles.strategyIcon}>🐐</Text>
              </View>
              <View style={styles.strategyInfo}>
                <Text style={[styles.strategyName, { color: colors.textPrimary }]}>All Listings</Text>
                <Text style={[styles.strategyDescription, { color: colors.textSecondary }]}>Browse everything on BidGoat</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#666' : '#999'} />
            </TouchableOpacity>

            {/* Strategy Cards */}
            {availableStrategies.map((strategy) => (
              <TouchableOpacity
                key={strategy.name}
                style={[
                  styles.strategyCard,
                  {
                    backgroundColor: theme === 'dark' ? '#1C1C1E' : '#fff',
                    borderColor: theme === 'dark' ? '#2C2C2E' : '#E5E7EB',
                  }
                ]}
                onPress={() => {
                  setShowCategoryModal(false);
                  // Navigate directly to the appropriate screen
                  if (strategy.name === 'Buy It Now') {
                    router.push('/(tabs)/explore');
                  } else if (strategy.name === 'Must Sell') {
                    router.push('/(tabs)/');
                  } else if (strategy.name === 'Regular Auctions') {
                    router.push('/(tabs)/?type=auction');
                  } else if (strategy.name === 'Price Dropped') {
                    router.push('/relisted-discounts');
                  }
                }}
              >
                <View style={styles.strategyIconContainer}>
                  <Text style={styles.strategyIcon}>{strategy.icon}</Text>
                </View>
                <View style={styles.strategyInfo}>
                  <Text style={[styles.strategyName, { color: colors.textPrimary }]}>
                    {strategy.name}
                  </Text>
                  <Text style={[styles.strategyDescription, { color: colors.textSecondary }]}>
                    {strategy.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#666' : '#999'} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>

    {/* Birthstone Modal */}
    <Modal visible={showBirthstoneModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: 8 }]}>
          <Text style={styles.modalHeader}>💎 Birthday Sparkle Ritual</Text>
          <FlatList
            data={birthstones}
            numColumns={3}
            keyExtractor={(item: Birthstone) => item.month}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }: { item: Birthstone }) => {
              const textColor = item.color === '#dcdcdc' ? '#333' : '#fff';
              return (
                <TouchableOpacity
                  style={[styles.tile, { backgroundColor: item.color }]}
                  onPress={() =>
                    handleBirthstonePress(item.month, item.stone, item.meaning)
                  }
                >
                  <Text style={[styles.month, { color: textColor }]}>{item.month}</Text>
                  <Text style={[styles.stone, { color: textColor }]}>{item.stone}</Text>
                </TouchableOpacity>
              );
            }}
          />
          <TouchableOpacity onPress={() => setShowBirthstoneModal(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* Token Expired Modal */}
    <Modal visible={showTokenExpiredModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { width: '80%' }]}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="time-outline" size={48} color="#FF6B35" />
          </View>
          <Text style={[styles.modalHeader, { fontSize: 18, marginBottom: 8 }]}>Session Expired</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>
            Your session has expired. Please sign in again to continue.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#FF6B35',
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: 'center',
              marginBottom: 12,
            }}
            onPress={async () => {
              await AsyncStorage.multiRemove(['username', 'jwtToken', 'avatar_url']);
              setShowTokenExpiredModal(false);
              setUsername(null);
              router.push('/sign-in');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 12,
              alignItems: 'center',
            }}
            onPress={() => setShowTokenExpiredModal(false)}
          >
            <Text style={{ color: '#666', fontSize: 14 }}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </Animated.View>
);

};

const styles = StyleSheet.create({
  container: {
    position: Platform.OS === 'web' ? 'sticky' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_MAX_HEIGHT,
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderBottomWidth: 1,
    borderColor: '#ddd',
    overflow: 'visible',
  },
  modalScroll: {
  paddingBottom: 32,
  paddingHorizontal: 16,
  alignItems: 'flex-start',
},
  header: {
    position:  'relative',
  justifyContent: 'center',
  paddingHorizontal: 16,
  paddingBottom: 4,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderColor: '#ddd',
  overflow: 'hidden',  // 👈 critical for height animation
  minHeight: 110,
  maxHeight: 110,
  flexShrink: 0,  // Never compress
  flexGrow: 0,    // Never expand

},
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 2,
    gap: 8,
    minHeight: 48,
    flexShrink: 0,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logoBid: {
    color: '#6A0DAD', // Purple
  },
  logoGoat: {
    color: '#4CAF50', // Gold
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  // eBay-Style Search Container - Now full width
  ebaySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3665f3', // eBay blue
    overflow: 'hidden',
    height: 40,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
    height: '100%',
    justifyContent: 'center',
    minWidth: 100,
    maxWidth: 140,
    flexShrink: 1,  // Allow compression
    flexGrow: 0,    // Don't expand
  },
  categoryText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  searchDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e5e5e5',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    minWidth: 100,  // Prevent total collapse
    flexShrink: 1,  // Can compress if needed
  },
  searchButton: {
    backgroundColor: '#3665f3', // eBay blue
    paddingHorizontal: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
  color: '#000', // mystical purple
  fontSize: 15,
  fontWeight: 'bold',
  textShadowColor: '#F5F5F5',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 2,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    color: '#333',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    minWidth: 44,
    maxWidth: 44,
    minHeight: 44,
    maxHeight: 44,
    flexShrink: 0,
    flexGrow: 0,
  },
  iconWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 4,
},

linkWrapper: {
  justifyContent: 'center',
  alignItems: 'center',
  height: 28, // match icon height
},

  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    height: '100%',
    paddingVertical: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    width: '85%',
    maxHeight: '80%',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent overlay
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuProfileSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  menuProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuProfileInfo: {
    flex: 1,
  },
  menuProfileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  menuProfileLink: {
    fontSize: 14,
    color: '#6A0DAD',
    fontWeight: '600',
  },
  modalHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: '#fff',
    gap: 12,
  },
  modalText: {
    fontSize: 15,
    color: '#2d3748',
    fontWeight: '500',
  },
  closeText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  tile: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderWidth: 1,
    borderColor: '#aaa',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  month: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  stone: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  cartContainer: {
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  height: 40, // match other icons
},

  cartIcon: {
  width: 40,
  height: 40,
  maxHeight: 40,
  resizeMode: 'contain',
},

  badge: {
   position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    justifyContent: 'center',
  alignItems: 'center',
},

badgeText: {
  color: 'white',
  fontSize: 10,
  textAlign: 'center',
},
  notificationContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF1744',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Dropdown container (floats below search bar)
  dropdown: {
    position: 'absolute',
    top: 100, // below main row (removed badge)
    left: 0,
    right: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 0,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#ddd',
    zIndex: 2000,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    maxHeight: 500, // Increased for larger cards
  },

  dropdownScroll: {
    maxHeight: 450,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  resultLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  resultMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6A0DAD',
  },
  dropdownClose: {
    fontSize: 18,
    fontWeight: '700',
    color: '#999',
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  resultContent: {
    flex: 1,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6A0DAD',
    marginTop: 2,
  },
  resultScore: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  emptyResults: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  // Category Modal
  categoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    maxHeight: '85%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  categoryDivider: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    pointerEvents: 'none',
  },
  categoryOptionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
  },
  categoryOptionTextSelected: {
    color: '#6A0DAD',
    fontWeight: '600',
  },
  categoryCloseButton: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryCloseText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  categorySignedIn: {
    backgroundColor: '#f0f9ff',
    pointerEvents: 'none',
  },
  categorySignedInText: {
    color: '#38a169',
    fontWeight: '600',
  },
  categoryModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalSubheader: {
    fontSize: 14,
    marginTop: 4,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 16,
  },
  strategyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strategyIcon: {
    fontSize: 24,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  strategySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 2,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  strategySearchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  strategySearchButtonContainer: {
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  strategySearchButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6A0DAD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  strategySearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 10,
  },
  strategySearchButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  strategySearchButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F4FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6A0DAD',
    gap: 4,
  },
  signInButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6A0DAD',
  },
  signInText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#38a169',
  },


});


export default EnhancedHeader;
