import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { maskOpeningTime, openingDayLabels, openingDayOrder, type OpeningDay, type OpeningPeriod } from './openingHours';

type Props = { days: OpeningDay[]; onChange: (days: OpeningDay[]) => void; disabled?: boolean; error?: string };

export default function HostOpeningHours({ days, onChange, disabled = false, error }: Props) {
  function updateDay(dayOfWeek: number, patch: Partial<OpeningDay>) {
    onChange(days.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day));
  }
  function updatePeriod(day: OpeningDay, index: number, patch: Partial<OpeningPeriod>) {
    updateDay(day.dayOfWeek, { periods: day.periods.map((period, i) => i === index ? { ...period, ...patch } : period) });
  }
  return <View style={styles.week}>
    <Text style={styles.helper}>Marque os dias em que abre e informe os horários locais do estabelecimento. Para uma pausa no almoço, adicione outro intervalo.</Text>
    <Pressable accessibilityRole="button" disabled={disabled} onPress={() => {
      const monday = days.find((day) => day.dayOfWeek === 1)!;
      onChange(days.map((day) => day.dayOfWeek >= 2 && day.dayOfWeek <= 5 ? { ...day, isClosed: monday.isClosed, periods: monday.periods.map((period) => ({ ...period })) } : day));
    }} style={[styles.copy, disabled && styles.disabled]}><Text style={styles.copyText}>Repetir segunda de terça a sexta</Text></Pressable>
    {openingDayOrder.map((dayOfWeek) => {
      const day = days.find((item) => item.dayOfWeek === dayOfWeek)!;
      return <View key={dayOfWeek} style={[styles.day, !day.isClosed && styles.openDay]}>
        <View style={styles.heading}>
          <Text style={styles.dayName}>{openingDayLabels[dayOfWeek]}</Text>
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: !day.isClosed, disabled }} accessibilityLabel={`Abre ${openingDayLabels[dayOfWeek]}`} disabled={disabled} onPress={() => updateDay(dayOfWeek, { isClosed: !day.isClosed, periods: day.isClosed ? [{ openingTime: '09:00', closingTime: '18:00', closesNextDay: false }] : [] })} style={[styles.toggle, !day.isClosed && styles.toggleOpen]}>
            <Text style={[styles.toggleText, !day.isClosed && styles.toggleOpenText]}>{day.isClosed ? 'Fechado' : '✓ Aberto'}</Text>
          </Pressable>
        </View>
        {!day.isClosed ? <>
          {day.periods.map((period, index) => <View key={index} style={styles.period}>
            <View style={styles.timeRow}>
              {([{ field: 'openingTime', label: 'Abre às' }, { field: 'closingTime', label: 'Fecha às' }] as const).map(({ field, label }) => <View key={field} style={styles.timeField}>
                <Text style={styles.label}>{label}</Text>
                <TextInput accessibilityLabel={`${openingDayLabels[dayOfWeek]}, intervalo ${index + 1}, ${label}`} editable={!disabled} keyboardType="numbers-and-punctuation" maxLength={8} onChangeText={(value) => updatePeriod(day, index, { [field]: maskOpeningTime(value) })} placeholder="09:00" placeholderTextColor="#9297A3" style={styles.input} value={period[field]} />
              </View>)}
            </View>
            <Pressable accessibilityRole="checkbox" accessibilityLabel={`${openingDayLabels[dayOfWeek]}, intervalo ${index + 1}, fecha no dia seguinte`} accessibilityState={{ checked: period.closesNextDay, disabled }} disabled={disabled} onPress={() => updatePeriod(day, index, { closesNextDay: !period.closesNextDay })} style={styles.nextDay}><Text style={styles.nextDayText}>{period.closesNextDay ? '☑' : '☐'} Fecha no dia seguinte</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`${openingDayLabels[dayOfWeek]}: ${day.periods.length === 1 ? 'fechar dia' : `remover intervalo ${index + 1}`}`} disabled={disabled} onPress={() => { const periods = day.periods.filter((_, i) => i !== index); updateDay(dayOfWeek, { periods, isClosed: periods.length === 0 }); }} style={styles.remove}><Text style={styles.removeText}>{day.periods.length === 1 ? 'Fechar neste dia' : 'Remover intervalo'}</Text></Pressable>
          </View>)}
          <Pressable accessibilityRole="button" accessibilityLabel={`Adicionar intervalo em ${openingDayLabels[dayOfWeek]}`} disabled={disabled} onPress={() => updateDay(dayOfWeek, { periods: [...day.periods, { openingTime: '', closingTime: '', closesNextDay: false }] })} style={styles.add}><Text style={styles.copyText}>+ Adicionar intervalo</Text></Pressable>
        </> : null}
      </View>;
    })}
    <Text style={styles.helper}>{days.every((day) => day.isClosed) ? 'Todos os dias estão marcados como fechados. Ative os dias de atendimento antes de salvar, se houver.' : 'Confira os horários antes de salvar. Ex.: 18:00 até 02:00 precisa de “Fecha no dia seguinte”.'}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  week: { gap: 12 }, helper: { color: '#667085', fontSize: 11, lineHeight: 17 },
  copy: { minHeight: 42, padding: 10, borderRadius: 10, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center' }, copyText: { color: '#B33B00', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  day: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FCFAF6', gap: 12 }, openDay: { backgroundColor: '#FFFEFC' },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, dayName: { color: '#002B5C', fontSize: 12, fontWeight: '700' },
  toggle: { minHeight: 40, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#EEEAE3', alignItems: 'center', justifyContent: 'center' }, toggleOpen: { backgroundColor: '#002B5C' }, toggleText: { color: '#667085', fontSize: 11, fontWeight: '700' }, toggleOpenText: { color: '#FFFFFF' },
  period: { gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: '#E7E0D6' }, timeRow: { flexDirection: 'row', gap: 10 }, timeField: { flex: 1, minWidth: 0, gap: 6 }, label: { color: '#002B5C', fontSize: 10, fontWeight: '700' }, input: { minHeight: 46, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E7E0D6', backgroundColor: '#FCFAF6', color: '#002B5C', fontSize: 15 },
  nextDay: { minHeight: 40, justifyContent: 'center' }, nextDayText: { color: '#002B5C', fontSize: 11 }, remove: { minHeight: 36, justifyContent: 'center' }, removeText: { color: '#9C3020', fontSize: 10, fontWeight: '600' },
  add: { minHeight: 40, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.5 }, error: { color: '#B42318', fontSize: 12, lineHeight: 18 },
});
