import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

export type HostNavKey = 'panel' | 'events' | 'create' | 'commerce';
export type UserNavKey = 'explore' | 'roadmap' | 'nearby' | 'favorites' | 'profile' | 'commerce';

type AppBottomNavProps =
  | { mode: 'host'; active?: HostNavKey }
  | { mode: 'user'; active?: UserNavKey; lastItem?: 'profile' | 'commerce' };

type NavItemProps = {
  active: boolean;
  activeIcon: ComponentProps<typeof Ionicons>['name'];
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
};

function NavItem({ active, activeIcon, icon, label, onPress }: NavItemProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.item, active && styles.itemActive, pressed && styles.pressed]}
    >
      <Ionicons color={active ? colors.orange : '#7E8490'} name={active ? activeIcon : icon} size={21} />
      <Text numberOfLines={1} style={[styles.label, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

function go(path: Href) {
  router.push(path);
}

export default function AppBottomNav(props: AppBottomNavProps) {
  if (props.mode === 'host') {
    return (
      <View style={styles.bar}>
        <View style={styles.content}>
          <NavItem active={props.active === 'panel'} activeIcon="grid" icon="grid-outline" label="Painel" onPress={() => go('/painel')} />
          <NavItem active={props.active === 'events'} activeIcon="calendar" icon="calendar-outline" label="Meus eventos" onPress={() => go('/meus_eventos')} />
          <NavItem active={props.active === 'create'} activeIcon="add-circle" icon="add-circle-outline" label="Criar evento" onPress={() => go('/')} />
          <NavItem active={props.active === 'commerce'} activeIcon="storefront" icon="storefront-outline" label="Comércio" onPress={() => go({ pathname: '/comercio', params: { gestao: '1' } } as Href)} />
        </View>
      </View>
    );
  }

  const lastItem = props.lastItem ?? 'profile';
  return (
    <View style={styles.bar}>
      <View style={styles.content}>
        <NavItem active={props.active === 'explore'} activeIcon="compass" icon="compass-outline" label="Explorar" onPress={() => go('/explorar')} />
        <NavItem active={props.active === 'roadmap'} activeIcon="map" icon="map-outline" label="Roteiro" onPress={() => go('/roteiro')} />
        <NavItem active={props.active === 'nearby'} activeIcon="navigate-circle" icon="navigate-circle-outline" label="Perto de você" onPress={() => go('/perto_de_voce')} />
        <NavItem active={props.active === 'favorites'} activeIcon="heart" icon="heart-outline" label="Favoritos" onPress={() => go('/favoritos')} />
        {lastItem === 'commerce'
          ? <NavItem active={props.active === 'commerce'} activeIcon="storefront" icon="storefront-outline" label="Comércio" onPress={() => go('/comercio')} />
          : <NavItem active={props.active === 'profile'} activeIcon="person-circle" icon="person-circle-outline" label="Perfil" onPress={() => go('/perfil')} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 76,
    paddingHorizontal: 6,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  content: {
    width: '100%',
    maxWidth: 620,
    minHeight: 69,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 58,
    paddingHorizontal: 2,
    paddingBottom: 5,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    borderRadius: 13,
  },
  itemActive: {
    backgroundColor: colors.hostBackground,
  },
  label: {
    color: '#7E8490',
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  activeText: {
    color: colors.orange,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
