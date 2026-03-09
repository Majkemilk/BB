import { useTasks } from '@/contexts/TaskContext';
import { ChartBar, Droplets, Flower, Heart, Sprout, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, G, Rect, Svg, Text as SvgText, TSpan } from 'react-native-svg';

export default function GrowthTrackerScreen() {
  const { tasks, wildflowers, getEfficiencyStats } = useTasks();
  const efficiencyStats = getEfficiencyStats();

  const gardenHealthData = useMemo(() => {
    const safeTasks = tasks || [];
    const safeWildflowers = wildflowers || [];
    const now = new Date();
    const growingCount = safeTasks.filter(task => !task.isCompleted).length;
    const thirstyCount = safeTasks.filter(task => 
      !task.isCompleted && task.dueDate && new Date(task.dueDate) < now
    ).length;
    return [
      { thematicLabel: 'Wildflowers', functionalLabel: '(ideas)', value: safeWildflowers.length, color: '#9C27B0', icon: Sprout },
      { thematicLabel: 'Growing Plants', functionalLabel: '(active)', value: growingCount, color: '#4CAF50', icon: Flower },
      { thematicLabel: 'Thirsty Plants', functionalLabel: '(overdue)', value: thirstyCount, color: '#F44336', icon: Droplets }
    ];
  }, [tasks, wildflowers]);

  const maxValue = Math.max(...gardenHealthData.map(d => d.value), 1);
  const barWidth = 60;
  const barGap = 40;
  const chartPaddingHorizontal = 20;
  const chartWidth = (barWidth + barGap) * gardenHealthData.length - barGap + (chartPaddingHorizontal * 2);
  const chartHeight = 220;
  const barMaxHeight = chartHeight - 110; 

  const gaugeSize = 120;
  const strokeWidth = 12;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = efficiencyStats.efficiencyScore / 100;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconHeader}>
          <ChartBar size={28} color="#4CAF50" />
          <Text style={styles.headerSlogan}>Track progress, celebrate growth</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Heart size={24} color="#4CAF50" />
          <Text style={styles.chartTitle}>Garden Health Overview</Text>
        </View>
        <View style={styles.chart}>
          <Svg width={chartWidth} height={chartHeight}>
            {gardenHealthData.map((item, index) => {
              const barHeight = item.value > 0 ? (item.value / maxValue) * barMaxHeight : 0;
              const x = chartPaddingHorizontal + index * (barWidth + barGap);
              const y = chartHeight - barHeight - 70;
              const IconComponent = item.icon;
              return (
                <G key={index}>
                  <Rect x={x} y={chartHeight - 70} width={barWidth} height={2} fill="#E0E0E0" />
                  <Rect x={x} y={y} width={barWidth} height={barHeight} fill={item.color} opacity={0.9} rx={6} />
                  <SvgText x={x + barWidth / 2} y={y - 10} fill="#333333" fontSize="14" fontWeight="bold" textAnchor="middle">{item.value}</SvgText>
                  <G>
                    <G x={x + (barWidth - 24) / 2} y={chartHeight - 62}>
                      <IconComponent size={24} color={item.color} />
                    </G>
                    <SvgText x={x + barWidth / 2} y={chartHeight - 20} textAnchor="middle" fontSize="12" fontWeight="600" fill="#333333">
                      {item.thematicLabel}
                      <TSpan x={x + barWidth / 2} dy="15" fill="#666666" fontSize="10" fontWeight="normal">{item.functionalLabel}</TSpan>
                    </SvgText>
                  </G>
                </G>
              );
            })}
          </Svg>
        </View>
      </View>

      <View style={styles.efficiencyContainer}>
        <View style={styles.efficiencyHeader}>
          <Target size={24} color="#FF9800" />
          <Text style={styles.efficiencyTitle}>Efficiency Score</Text>
        </View>
        <View style={styles.efficiencyContent}>
          <View style={styles.gaugeContainer}>
            <Svg width={gaugeSize} height={gaugeSize}>
              <Circle cx={gaugeSize / 2} cy={gaugeSize / 2} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="transparent" />
              <Circle cx={gaugeSize / 2} cy={gaugeSize / 2} r={radius} stroke={efficiencyStats.efficiencyScore >= 80 ? '#4CAF50' : efficiencyStats.efficiencyScore >= 60 ? '#FF9800' : '#F44336'} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`} />
              <SvgText x={gaugeSize / 2} y={gaugeSize / 2 - 10} textAnchor="middle" fontSize="24" fontWeight="bold" fill="#333333">{efficiencyStats.efficiencyScore}%</SvgText>
              <SvgText x={gaugeSize / 2} y={gaugeSize / 2 + 15} textAnchor="middle" fontSize="12" fill="#666666">on time</SvgText>
            </Svg>
          </View>
          <View style={styles.efficiencyStats}>
            <View style={styles.statRow}><Text style={styles.statLabel}>Total Completed:</Text><Text style={styles.statValue}>{efficiencyStats.totalCompleted}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>On Time:</Text><Text style={[styles.statValue, { color: '#4CAF50' }]}>{efficiencyStats.onTimeCompleted}</Text></View>
            <View style={styles.statRow}><Text style={styles.statLabel}>Late:</Text><Text style={[styles.statValue, { color: '#F44336' }]}>{efficiencyStats.lateCompleted}</Text></View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  iconHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerSlogan: { fontSize: 16, color: '#666666', marginLeft: 12, flex: 1 },
  chartContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginVertical: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  chartTitle: { fontSize: 18, fontWeight: '600', color: '#333333', marginLeft: 12 },
  chart: { alignItems: 'center', paddingVertical: 10 },
  efficiencyContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginVertical: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  efficiencyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  efficiencyTitle: { fontSize: 18, fontWeight: '600', color: '#333333', marginLeft: 12 },
  efficiencyContent: { flexDirection: 'row', alignItems: 'center' },
  gaugeContainer: { marginRight: 20 },
  efficiencyStats: { flex: 1 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { fontSize: 14, fontWeight: '600', color: '#333333' },
  statValue: { fontSize: 14, color: '#666666' },
});


