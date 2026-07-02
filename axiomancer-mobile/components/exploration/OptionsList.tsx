import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import { SectionLabel } from '@/components/SectionLabel';
import { OptionRow } from './OptionRow';
import type { ExplorationOption } from '@/state/presenters/exploration.engine';

interface OptionsListProps {
    options: readonly ExplorationOption[];
    onOptionPress: (option: ExplorationOption) => void;
    drawerCopy: {
        title: string;
        emptyMessage: string;
        leaguesLabel: string;
    };
}

export function OptionsList({ options, onOptionPress, drawerCopy }: OptionsListProps) {
    const styles = useStyles();
    return (
        <View style={styles.drawer}>
            <View style={styles.drawerHeader}>
                <SectionLabel size={10}>{drawerCopy.title}</SectionLabel>
            </View>
            {options.length === 0 ? (
                <View style={styles.drawerEmpty} testID="options-empty">
                    <Text style={styles.drawerEmptyText}>{drawerCopy.emptyMessage}</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.stepCardScroll}
                >
                    {options.slice(0, 4).map((opt) => (
                        <OptionRow
                            key={opt.nodeId}
                            option={opt}
                            onPress={onOptionPress}
                            leaguesLabel={drawerCopy.leaguesLabel}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    drawer: {
        paddingHorizontal: 10,
        paddingBottom: 8,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    drawerEmpty: {
        marginHorizontal: 4,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
    },
    drawerEmptyText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 13,
        color: AXM.bone,
    },
    stepCardScroll: {
        gap: 6,
        paddingVertical: 2,
    },
}));