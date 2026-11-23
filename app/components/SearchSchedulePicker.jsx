import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Icon from "@expo/vector-icons/Feather";
const colors = {
  secondary_green_deep: "#2E5B24", text_muted: "#718078", surface: "#FFFFFF",
  surface_soft: "#F7FAF5", text_field: "#24342A", surface_neutral: "#F2F5F1",
  text_strong: "#1E2D23", text_subtle: "#96A299", border_soft: "#E4EBE3",
  border_green: "#E1EBDD", border_green_selected: "#A6CB84",
  surface_green_selected: "#F1F8EB", handle: "#D9E2D9",
  primary_green: "#67AB0F", surface_green: "#E8F3E1",
  surface_neutral_alt: "#F3F7F1", text_placeholder: "#89958E",
};

const GREEN = colors.secondary_green_deep;
const MUTED = colors.text_muted;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

const pad = (number) => String(number).padStart(2, "0");
const formatDateValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatSearchDate = (value) => {
  if (!value) return "Choose a date";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatSearchTime = (value) => {
  if (!value) return "Choose a time";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${pad(minute)} ${hour < 12 ? "AM" : "PM"}`;
};

export default function SearchSchedulePicker({ mode, value, onChange }) {
  const isDate = mode === "date";
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);
  const [displayMonth, setDisplayMonth] = useState(new Date());

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const open = () => {
    Keyboard.dismiss();
    const now = new Date();
    const initialValue = value || (isDate ? formatDateValue(now) : `${pad(now.getHours())}:${pad(Math.floor(now.getMinutes() / 5) * 5)}`);
    setDraft(initialValue);
    if (isDate) {
      const [year, month] = initialValue.split("-").map(Number);
      setDisplayMonth(new Date(year, month - 1, 1));
    }
    setVisible(true);
  };

  const [draftHour = 0, draftMinute = 0] = (draft || "00:00").split(":").map(Number);
  const period = draftHour < 12 ? "AM" : "PM";
  const hour12 = draftHour % 12 || 12;
  const setTime = (hour, minute, nextPeriod) => {
    const hour24 = hour % 12 + (nextPeriod === "PM" ? 12 : 0);
    setDraft(`${pad(hour24)}:${pad(minute)}`);
  };

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const leadingDays = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((leadingDays + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - leadingDays + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
  const today = formatDateValue(new Date());

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isDate ? "Choose a date" : "Choose a time"}
        onPress={open}
        style={[styles.field, value && styles.selectedField]}
      >
        <View style={styles.iconWrap}>
          <Icon name={isDate ? "calendar" : "clock"} size={19} color={GREEN} />
        </View>
        <Text style={styles.fieldLabel}>{isDate ? "DATE" : "TIME"}</Text>
        <Text style={[styles.fieldValue, !value && styles.placeholder]} numberOfLines={1}>
          {isDate ? formatSearchDate(value) : formatSearchTime(value)}
        </Text>
        <Icon name="chevron-down" size={16} color={MUTED} style={styles.chevron} />
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} accessibilityLabel="Close picker" />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetEyebrow}>PLAN YOUR SEARCH</Text>
                <Text style={styles.sheetTitle}>{isDate ? "Select a date" : "Select a time"}</Text>
              </View>
              <Pressable onPress={() => setVisible(false)} accessibilityRole="button" accessibilityLabel="Close picker" style={styles.closeButton}>
                <Icon name="x" size={20} color={GREEN} />
              </Pressable>
            </View>

            {isDate ? (
              <ScrollView style={styles.pickerBody} showsVerticalScrollIndicator={false}>
                <View style={styles.monthHeader}>
                  <Pressable onPress={() => setDisplayMonth(new Date(year, month - 1, 1))} accessibilityRole="button" accessibilityLabel="Previous month" style={styles.monthButton}>
                    <Icon name="chevron-left" size={21} color={GREEN} />
                  </Pressable>
                  <Text style={styles.monthText}>
                    {displayMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </Text>
                  <Pressable onPress={() => setDisplayMonth(new Date(year, month + 1, 1))} accessibilityRole="button" accessibilityLabel="Next month" style={styles.monthButton}>
                    <Icon name="chevron-right" size={21} color={GREEN} />
                  </Pressable>
                </View>
                <View style={styles.calendarGrid}>
                  {WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
                  {cells.map((day, index) => {
                    const dateValue = day ? formatDateValue(new Date(year, month, day)) : null;
                    return (
                      <View key={index} style={styles.daySlot}>
                        {day && (
                          <Pressable
                            onPress={() => setDraft(dateValue)}
                            accessibilityRole="button"
                            accessibilityLabel={`${day} ${displayMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`}
                            style={[styles.dayButton, draft === dateValue && styles.activeChoice]}
                          >
                            <Text style={[styles.dayText, dateValue === today && styles.todayText, draft === dateValue && styles.activeText]}>{day}</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <View>
                <Text style={styles.timeHint}>Pick an hour, minute, and period</Text>
                <View style={styles.timeColumns}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.columnLabel}>HOUR</Text>
                    <ScrollView style={styles.timeScroll} contentContainerStyle={styles.timeOptions} nestedScrollEnabled>
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
                        <Pressable key={hour} onPress={() => setTime(hour, draftMinute, period)} style={[styles.timeChoice, hour12 === hour && styles.activeChoice]} accessibilityRole="button" accessibilityLabel={`${hour} o'clock`}>
                          <Text style={[styles.choiceText, hour12 === hour && styles.activeText]}>{pad(hour)}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.timeColumn}>
                    <Text style={styles.columnLabel}>MINUTE</Text>
                    <ScrollView style={styles.timeScroll} contentContainerStyle={styles.timeOptions} nestedScrollEnabled>
                      {MINUTES.map((minute) => (
                        <Pressable key={minute} onPress={() => setTime(hour12, minute, period)} style={[styles.timeChoice, draftMinute === minute && styles.activeChoice]} accessibilityRole="button" accessibilityLabel={`${pad(minute)} minutes`}>
                          <Text style={[styles.choiceText, draftMinute === minute && styles.activeText]}>{pad(minute)}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.periodColumn}>
                    <Text style={styles.columnLabel}>PERIOD</Text>
                    { ["AM", "PM"].map((item) => (
                      <Pressable key={item} onPress={() => setTime(hour12, draftMinute, item)} style={[styles.timeChoice, period === item && styles.activeChoice]} accessibilityRole="button" accessibilityLabel={item}>
                        <Text style={[styles.choiceText, period === item && styles.activeText]}>{item}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            <View style={styles.sheetActions}>
              <Pressable onPress={() => { onChange(null); setVisible(false); }} accessibilityRole="button" style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
              <Pressable onPress={() => { onChange(draft); setVisible(false); }} accessibilityRole="button" style={styles.applyButton}>
                <Text style={styles.applyText}>Apply {isDate ? "date" : "time"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, minHeight: 78, backgroundColor: colors.surface_soft, borderColor: colors.border_green, borderWidth: 1, borderRadius: 15, padding: 10 },
  selectedField: { backgroundColor: colors.surface_green_selected, borderColor: colors.border_green_selected },
  iconWrap: { width: 25, height: 25, borderRadius: 8, backgroundColor: colors.surface_green, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  fieldLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.1, color: MUTED, marginBottom: 3 },
  fieldValue: { fontSize: 12, fontWeight: "600", color: colors.text_field, paddingRight: 10 },
  placeholder: { color: colors.text_placeholder, fontWeight: "500" },
  chevron: { position: "absolute", right: 9, bottom: 10 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17, 35, 24, 0.42)" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 11, paddingBottom: 32, maxHeight: Dimensions.get("window").height * 0.84 },
  handle: { width: 36, height: 4, borderRadius: 4, backgroundColor: colors.handle, alignSelf: "center", marginBottom: 24 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  sheetEyebrow: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, color: colors.primary_green, marginBottom: 5 },
  sheetTitle: { fontSize: 24, fontWeight: "700", color: colors.text_strong },
  pickerBody: { flexShrink: 1 },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface_neutral, alignItems: "center", justifyContent: "center" },
  monthHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  monthButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface_neutral_alt, alignItems: "center", justifyContent: "center" },
  monthText: { fontSize: 16, fontWeight: "700", color: colors.text_field },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  weekday: { width: "14.2857%", textAlign: "center", color: MUTED, fontSize: 11, fontWeight: "700", paddingVertical: 10 },
  daySlot: { width: "14.2857%", height: 42, alignItems: "center", justifyContent: "center" },
  dayButton: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 14, color: colors.text_field },
  todayText: { color: GREEN, fontWeight: "700" },
  activeChoice: { backgroundColor: GREEN },
  activeText: { color: colors.surface, fontWeight: "700" },
  timeHint: { color: MUTED, fontSize: 13, marginBottom: 18 },
  timeColumns: { flexDirection: "row", gap: 12 },
  timeColumn: { flex: 1 },
  periodColumn: { flex: 1 },
  columnLabel: { color: MUTED, fontSize: 10, fontWeight: "700", letterSpacing: 1.1, textAlign: "center", marginBottom: 9 },
  timeScroll: { maxHeight: Math.min(190, Dimensions.get("window").height * 0.28), backgroundColor: colors.surface_soft, borderRadius: 16 },
  timeOptions: { alignItems: "center", padding: 6 },
  timeChoice: { height: 40, width: "100%", borderRadius: 11, alignItems: "center", justifyContent: "center" },
  choiceText: { color: colors.text_field, fontSize: 15, fontWeight: "600" },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 25 },
  clearButton: { flex: 1, height: 50, borderRadius: 15, backgroundColor: colors.surface_neutral, alignItems: "center", justifyContent: "center" },
  clearText: { color: GREEN, fontSize: 15, fontWeight: "700" },
  applyButton: { flex: 2, height: 50, borderRadius: 15, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  applyText: { color: colors.surface, fontSize: 15, fontWeight: "700" },
});
