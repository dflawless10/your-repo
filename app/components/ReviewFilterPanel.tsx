import React from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity} from 'react-native';
import StarRangeSlider from './StarRangeSlider';
import TagSelector from './TagSelector';
import MediaToggle from './MediaToggle';

import { ReviewFilter } from '@/types/ReviewFilter';
import CheckboxGroup from 'app/components/CheckBoxGroup';
import DateRangePicker from 'app/components/DataRangePicker';
import Dropdown from 'app/components/DropDown';
import GlobalFooter from "@/app/components/GlobalFooter";


type Props = {
  filter: ReviewFilter;
  setFilter: React.Dispatch<React.SetStateAction<ReviewFilter>>;
};

export default function ReviewFilterPanel({ filter, setFilter }: Readonly<Props>) {

  return (

    <View style={styles.panel}>
      <TextInput
        placeholder="Search reviews..."
        value={filter.keyword}
        onChangeText={(text) => setFilter({ ...filter, keyword: text })}
        style={styles.input}
      />

      <StarRangeSlider
        min={filter.minRating}
        max={filter.maxRating}
        onChange={(min, max) => setFilter({ ...filter, minRating: min, maxRating: max })}
      />
      <TagSelector
        selected={filter.sentiments}
        onChange={(tags) => setFilter({ ...filter, sentiments: tags })}
      />
      <MediaToggle
        selected={filter.mediaTypes}
        onChange={(types) => setFilter({ ...filter, mediaTypes: types })}
      />
      <Dropdown
        label="Location"
        options={[]}
        selected={filter.location}
        onSelect={(location: string) => setFilter({ ...filter, location })}
      />
<CheckboxGroup
  label="Trust Filters"
  options={[
    { label: 'Verified Purchase', value: 'verified' },
    { label: 'Suspicious Review', value: 'flagged' },
  ]}
  selected={filter.integrity}
  onChange={(selected) => setFilter({ ...filter, integrity: selected })}
/>

<DateRangePicker
  label="Delivery Date"
  start={filter.deliveryStart}
  end={filter.deliveryEnd}
  onChange={(start, end) => setFilter({ ...filter, deliveryStart: start, deliveryEnd: end })}
/>

<Dropdown
  label="Item Variant"
  options={['Platinum', 'Gold', 'Silver', 'Used', 'New']}
  selected={filter.variant}
  onSelect={(variant) => setFilter({ ...filter, variant })}
/>

 <Dropdown
  label="Seller Response"
  options={['responded', 'unanswered']}
  selected={filter.sellerResponse}
  onSelect={(val) => setFilter({ ...filter, sellerResponse: val })}
/>

<Dropdown
  label="Sort By"
  options={['newest', 'oldest', 'highest rating', 'lowest rating']}
  selected={filter.sortBy}
  onSelect={(val) => setFilter({ ...filter, sortBy: val })}
/>


    </View>

  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  shareButton: {
  backgroundColor: '#6A0DAD',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignSelf: 'flex-start',
  marginBottom: 16,
},
shareText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
});
