import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors } from './src/theme/colors';

// Auth screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Tab screens & stacks
import FeedScreen from './src/screens/FeedScreen';
import JobsScreen from './src/screens/JobsScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import CreateJobScreen from './src/screens/CreateJobScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
};

function JobsStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="JobsList" component={JobsScreen} options={{ title: 'Jobs & Internships' }} />
            <Stack.Screen name="JobDetail" component={JobDetailScreen} options={{ title: 'Job Details' }} />
            <Stack.Screen name="CreateJob" component={CreateJobScreen} options={{ title: 'Post a Job' }} />
        </Stack.Navigator>
    );
}

function EventsStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="EventsList" component={EventsScreen} options={{ title: 'Events' }} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event Details' }} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create Event' }} />
        </Stack.Navigator>
    );
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = {
                        Feed: focused ? 'newspaper' : 'newspaper-outline',
                        Jobs: focused ? 'briefcase' : 'briefcase-outline',
                        Events: focused ? 'calendar' : 'calendar-outline',
                        Notifications: focused ? 'notifications' : 'notifications-outline',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                headerTitleStyle: { fontWeight: '700' },
                headerShadowVisible: false,
            })}
        >
            <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
            <Tab.Screen name="Jobs" component={JobsStack} options={{ headerShown: false, title: 'Jobs' }} />
            <Tab.Screen name="Events" component={EventsStack} options={{ headerShown: false, title: 'Events' }} />
            <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
        </Tab.Navigator>
    );
}

function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
    );
}

function RootNavigator() {
    const { isAuthenticated, loaded, loadToken } = useAuth();

    useEffect(() => { loadToken(); }, [loadToken]);

    if (!loaded) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <MainTabs /> : <AuthStack />}
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <RootNavigator />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

import { registerRootComponent } from 'expo';
registerRootComponent(App);
