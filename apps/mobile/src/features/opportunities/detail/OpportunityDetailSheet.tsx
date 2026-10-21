import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Lora_400Regular, Lora_500Medium, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { buttonColors } from '../../../../assets/colors';
import { canApply, compensationLabel, dateLabel, isHttpUrl, locationLabel, type DetailRecord, type DetailSource, type RelatedKind } from './detail-source';
import { useDetail, useRelated } from './use-detail';

const icons = {
  location: require('../../../../assets/opportunity-detail/map-pin.svg'),
  calendar: require('../../../../assets/opportunity-detail/calendar.svg'),
  audience: require('../../../../assets/opportunity-detail/users.svg'),
  external: require('../../../../assets/opportunity-detail/external-link.svg'),
  bookmark: require('../../../../assets/opportunity-detail/bookmark.svg'),
  chevron: require('../../../../assets/opportunity-detail/chevron-right.svg'),
};
const color = { cream: '#f5f2ec', ink: '#17201f', title: '#182a27', text: '#344440', muted: '#66736d', border: '#dedcd5', band: '#ebeae5', teal: buttonColors[0].pressed };

export type DetailSavedActions = {
  isSaved(id: string): boolean;
  toggle(id: string): void | Promise<void>;
  pending?: boolean;
  disabled?: boolean;
  error?: string;
  retry?: () => void;
};
type Props = { id: string; source: DetailSource; onClose: () => void; saved: DetailSavedActions };

function Icon({ name, size = 16 }: { name: keyof typeof icons; size?: number }) {
  return <Image source={icons[name]} style={{ width: size, height: size }} contentFit="contain" accessible={false} />;
}

export function OpportunityDetailSheet({ id, ...props }: Props) {
  // A fresh selection never flashes the previous record, including on rapid taps.
  return <SheetSession key={`${props.source.kind}:${id}`} id={id} {...props} />;
}

function SheetSession({ id, source, onClose, saved }: Props) {
  const [selected, setSelected] = useState(id);
  const [history, setHistory] = useState<string[]>([]);
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Lora_400Regular, Lora_500Medium, Lora_600SemiBold, Lora_700Bold });
  const closeRef = useRef(onClose); closeRef.current = onClose;
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dx) < gesture.dy,
    onPanResponderRelease: (_, gesture) => { if (gesture.dy > 50) closeRef.current(); },
  })).current;
  return <Modal transparent visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close opportunity details" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View accessibilityViewIsModal onAccessibilityEscape={onClose} style={[styles.sheet, { maxHeight: height - insets.top - 24, paddingBottom: insets.bottom }]}>
        <View {...pan.panHandlers} style={styles.handleArea}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close opportunity details" accessibilityHint="You can also swipe this handle down to close" hitSlop={12} style={styles.handleButton}>
            <View style={styles.handle} />
          </Pressable>
        </View>
        {history.length > 0 && <Pressable accessibilityRole="button" onPress={() => {
          setSelected(history[history.length - 1]); setHistory(previous => previous.slice(0, -1));
        }} style={styles.back}><Text style={styles.link}>‹ Back to previous opportunity</Text></Pressable>}
        <DetailBody key={selected} id={selected} source={source} saved={saved} fontsLoaded={fontsLoaded} onSelect={next => {
          setHistory(previous => [...previous, selected]); setSelected(next);
        }} />
      </View>
    </View>
  </Modal>;
}

function DetailBody({ id, source, saved, onSelect, fontsLoaded }: Omit<Props, 'onClose'> & { onSelect: (id: string) => void; fontsLoaded: boolean }) {
  const { record, error, retry } = useDetail(id, source);
  if (error) return <View style={styles.state}><Text accessibilityRole="alert" style={styles.body}>{error}</Text><Pressable onPress={retry} accessibilityRole="button" style={styles.retry}><Text style={styles.link}>Try again</Text></Pressable></View>;
  if (!record) return <View style={styles.state}><ActivityIndicator color={color.teal} accessibilityLabel="Loading opportunity" /><Text style={styles.body}>Loading opportunity…</Text></View>;
  return <DetailContent record={record} source={source} saved={saved} onSelect={onSelect} fontsLoaded={fontsLoaded} />;
}

function DetailContent({ record, source, saved, onSelect, fontsLoaded }: { record: DetailRecord; source: DetailSource; saved: DetailSavedActions; onSelect: (id: string) => void; fontsLoaded: boolean }) {
  const { opportunity: item, preview } = record;
  const [linkError, setLinkError] = useState<string>();
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const font = fontsLoaded ? undefined : { fontFamily: 'serif' };
  const location = locationLabel(item);
  const deadline = dateLabel(item.applicationDeadline);
  const compensation = compensationLabel(item.compensation);
  const expired = item.applicationDeadline !== null && Date.parse(item.applicationDeadline) < Date.now();
  const isPreview = source.kind === 'preview';
  const isSaved = saved.isSaved(item.id);

  async function openUrl(url: string) {
    if (openingRef.current) return;
    if (!isHttpUrl(url)) { setLinkError('A website isn’t available for this preview.'); return; }
    openingRef.current = true; setOpening(true); setLinkError(undefined);
    try { await WebBrowser.openBrowserAsync(url); }
    catch { if (mounted.current) setLinkError('Couldn’t open this website. Please try again.'); }
    finally { openingRef.current = false; if (mounted.current) setOpening(false); }
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      {item.organization && <View style={styles.organization}>
        <View style={styles.logo}>{item.organization.logoUrl && <Image source={{ uri: item.organization.logoUrl }} style={styles.logo} contentFit="contain" accessibilityLabel={`${item.organization.name} logo`} />}</View>
        <View style={styles.grow}>
          <Text style={[styles.organizationName, font]}>{item.organization.name}</Text>
          {preview?.organizationSubtitle && <Text style={[styles.secondary, font]}>{preview.organizationSubtitle}</Text>}
        </View>
      </View>}
      <Text accessibilityRole="header" style={[styles.title, font]}>{item.title}</Text>
      <View style={styles.badges}>
        {item.categories.map(category => <View key={category.id} style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>{category.name}</Text></View>)}
        {(preview?.badges ?? [compensation, item.workMode].filter((value): value is string => Boolean(value))).map((badge, index) => <View key={`${badge}:${index}`} style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>)}
        {(item.status !== 'active' || expired) && <View style={styles.badge}><Text style={styles.badgeText}>{expired ? 'Deadline passed' : item.status === 'closed' ? 'Closed' : 'Expired'}</Text></View>}
      </View>
      <View style={styles.metadata}>
        {location && <Metadata icon="location" label={location} font={font} />}
        {(preview?.eventDate || deadline) && <Metadata icon="calendar" label={preview?.eventDate ?? `Apply by ${deadline}`} font={font} />}
        {preview?.audience && <Metadata icon="audience" label={preview.audience} font={font} />}
      </View>
    </View>
    <View style={styles.about}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, font]}>About this opportunity</Text>
      <Text style={[styles.body, font]}>{item.description || item.summary || 'No description has been provided. Visit the source for more information.'}</Text>
      {item.summary && item.description && item.summary !== item.description && <Text style={[styles.body, font]}>{item.summary}</Text>}
      {item.educationLevels.length > 0 && <Text style={[styles.body, font]}>Education: {item.educationLevels.map(level => level.name).join(', ')}</Text>}
      {item.fields.length > 0 && <Text style={[styles.body, font]}>Fields: {item.fields.map(field => field.name).join(', ')}</Text>}
      {item.workAuthorization && <Text style={[styles.body, font]}>Work authorization: {item.workAuthorization}</Text>}
    </View>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: opening || (!isPreview && !canApply(item)) }} disabled={opening || (!isPreview && !canApply(item))} onPress={() => openUrl(item.applicationUrl)} style={({ pressed }) => [styles.action, styles.primaryAction, (opening || (!isPreview && !canApply(item))) && styles.disabled, pressed && styles.pressed]}>
        <Icon name="external" /><Text style={[styles.actionText, styles.white, font]}>{opening ? 'Opening…' : !isPreview && !canApply(item) ? 'Applications unavailable' : 'Visit Website'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={isSaved ? 'Remove saved opportunity' : 'Save for later'} accessibilityState={{ selected: isSaved, disabled: saved.pending || saved.disabled }} disabled={saved.pending || saved.disabled} onPress={() => saved.toggle(item.id)} style={({ pressed }) => [styles.action, styles.secondaryAction, (saved.pending || saved.disabled) && styles.disabled, pressed && styles.pressed]}>
        <Icon name="bookmark" /><Text style={[styles.actionText, font]}>{saved.pending ? 'Saving…' : isSaved ? 'Saved for Later' : 'Save for Later'}</Text>
      </Pressable>
      {linkError && <Text accessibilityRole="alert" style={styles.notice}>{linkError}</Text>}
      {saved.error && <Pressable disabled={!saved.retry} onPress={saved.retry} accessibilityRole={saved.retry ? 'button' : undefined}><Text accessibilityRole="alert" style={styles.notice}>{saved.error}</Text></Pressable>}
      {isPreview && <Text style={styles.notice}>Preview opportunity · saves stay on this screen</Text>}
      {!isPreview && isHttpUrl(item.sourceUrl) && <Pressable accessibilityRole="link" onPress={() => openUrl(item.sourceUrl)} style={styles.sourceLink}><Text style={styles.link}>View original source</Text></Pressable>}
    </View>
    <Related record={record} source={source} kind="organization" onSelect={onSelect} font={font} />
    <Related record={record} source={source} kind="similar" onSelect={onSelect} font={font} />
  </ScrollView>;
}

function Metadata({ icon, label, font }: { icon: 'location' | 'calendar' | 'audience'; label: string; font?: { fontFamily: string } }) {
  return <View style={styles.metaItem}><Icon name={icon} size={14} /><Text style={[styles.secondary, styles.shrink, font]}>{label}</Text></View>;
}

function Related({ record, source, kind, onSelect, font }: { record: DetailRecord; source: DetailSource; kind: RelatedKind; onSelect: (id: string) => void; font?: { fontFamily: string } }) {
  const { data, loading, error, retry } = useRelated(record, source, kind);
  const [expanded, setExpanded] = useState(false);
  if (!loading && !error && data.length === 0) return null;
  const title = kind === 'organization' ? `More from ${record.opportunity.organization?.name ?? 'this organization'}` : 'Similar Opportunities';
  return <View style={styles.related}>
    <View style={styles.relatedHeading}><Text accessibilityRole="header" style={[styles.relatedTitle, styles.grow, font]}>{title}</Text>
      {data.length > 1 && <Pressable onPress={() => setExpanded(value => !value)} accessibilityRole="button" accessibilityState={{ expanded }} hitSlop={8}><Text style={[styles.link, font]}>{expanded ? 'See less' : 'See more'}</Text></Pressable>}
    </View>
    {loading && <ActivityIndicator color={color.teal} accessibilityLabel={`Loading ${title}`} />}
    {error && <Pressable accessibilityRole="button" onPress={retry}><Text style={styles.notice}>Couldn’t load related opportunities. Tap to retry.</Text></Pressable>}
    {(expanded ? data : data.slice(0, 1)).map(({ opportunity: item, preview }) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`View ${item.title}`} onPress={() => onSelect(item.id)} style={({ pressed }) => [styles.relatedCard, pressed && styles.pressed]}>
      <View style={[styles.smallLogo, preview?.color ? { backgroundColor: preview.color } : undefined]}>
        {item.organization?.logoUrl ? <Image source={{ uri: item.organization.logoUrl }} style={styles.smallLogo} contentFit="contain" /> : <Text style={styles.initials}>{preview?.shortName ?? item.organization?.name.slice(0, 2).toUpperCase() ?? 'OR'}</Text>}
      </View>
      <View style={styles.grow}><Text style={[styles.relatedCardTitle, font]}>{item.title}</Text><Text style={[styles.relatedSubtitle, font]}>{[item.categories[0]?.name, preview?.eventDate || locationLabel(item), preview?.badges?.includes('Free') ? 'Free' : compensationLabel(item.compensation)].filter(Boolean).join(' · ')}</Text></View>
      <Icon name="chevron" />
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: color.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 600, alignSelf: 'center', boxShadow: '0px -4px 20px rgba(28,41,36,0.1)' },
  handleArea: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handleButton: { width: 64, height: 4, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#c8c7c1' },
  scroll: { flexShrink: 1 }, scrollContent: { paddingBottom: 16 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 12 },
  organization: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#4f9e9c' },
  grow: { flex: 1, minWidth: 0, gap: 2 }, shrink: { flexShrink: 1 },
  organizationName: { fontFamily: 'Lora_600SemiBold', fontSize: 13, color: color.ink },
  secondary: { fontFamily: 'Lora_400Regular', fontSize: 12, color: color.muted },
  title: { fontFamily: 'Lora_700Bold', fontSize: 22, lineHeight: 28, letterSpacing: -0.22, color: color.title },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  primaryBadge: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#e3f4f1', borderWidth: 0.5, borderColor: color.teal },
  primaryBadgeText: { fontSize: 11, fontWeight: '600', color: color.teal },
  badge: { borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: color.band, borderWidth: 0.5, borderColor: '#c8c7c1' },
  badgeText: { fontSize: 11, fontWeight: '500', color: color.text },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  about: { paddingHorizontal: 20, paddingVertical: 16, gap: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.border },
  sectionTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 14, color: color.ink },
  body: { fontFamily: 'Lora_400Regular', fontSize: 13, lineHeight: 20, color: color.text },
  actions: { paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  action: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryAction: { backgroundColor: color.teal, boxShadow: '0px 5px 9px rgba(28,41,36,0.1)' },
  secondaryAction: { backgroundColor: 'white', borderColor: color.border, borderWidth: 1.5 },
  actionText: { fontFamily: 'Lora_600SemiBold', color: '#286d6b', fontSize: 14, flexShrink: 1 }, white: { color: 'white' },
  disabled: { opacity: 0.5 }, pressed: { opacity: 0.7 },
  related: { padding: 20, paddingTop: 16, gap: 12, borderTopWidth: 8, borderColor: color.band },
  relatedHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  relatedTitle: { fontFamily: 'Lora_700Bold', fontSize: 15, color: color.ink },
  link: { fontFamily: 'Lora_500Medium', color: color.teal, fontSize: 13 },
  relatedCard: { padding: 12, borderRadius: 16, borderColor: color.border, borderWidth: 1, backgroundColor: 'white', flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallLogo: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#4f9e9c', alignItems: 'center', justifyContent: 'center' },
  initials: { color: 'white', fontSize: 10, fontFamily: 'Lora_700Bold' },
  relatedCardTitle: { fontFamily: 'Lora_600SemiBold', fontSize: 13, color: color.title },
  relatedSubtitle: { fontFamily: 'Lora_400Regular', fontSize: 11, color: color.muted },
  notice: { fontSize: 12, lineHeight: 18, color: color.muted },
  sourceLink: { alignSelf: 'center', padding: 8 }, back: { paddingHorizontal: 20, paddingBottom: 12 },
  state: { padding: 32, minHeight: 220, gap: 16, alignItems: 'center', justifyContent: 'center' }, retry: { padding: 12 },
});
