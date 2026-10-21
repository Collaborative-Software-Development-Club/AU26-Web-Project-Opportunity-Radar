import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { OpportunityDetailSheet } from '../src/features/opportunities/detail/OpportunityDetailSheet';
import { createPreviewSource, designPreviewRecords } from '../src/features/opportunities/detail/preview-source';

const source = createPreviewSource(designPreviewRecords);

// Development-only visual fixture at /detail-preview. No backend requests or auth bypass in production.
export default function DetailPreview() {
  const [visible, setVisible] = useState(true);
  const [ids, setIds] = useState<Set<string>>(new Set());
  if (!__DEV__) return <Redirect href="/" />;
  return <View style={{ flex: 1, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
    <Pressable accessibilityRole="button" onPress={() => setVisible(true)}><Text style={{ color: 'white' }}>Open detail preview</Text></Pressable>
    {visible && <OpportunityDetailSheet id="preview:figma" source={source} onClose={() => setVisible(false)} saved={{
      isSaved: id => ids.has(id),
      toggle: id => setIds(previous => {
        const next = new Set(previous);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      }),
    }} />}
  </View>;
}
