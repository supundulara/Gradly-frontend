import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider, useChat } from './src/context/ChatContext';
import { colors } from './src/theme/colors';
import { TouchableOpacity, Text } from 'react-native';

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
import MessagesListScreen from './src/screens/MessagesListScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Global AppHeader Components
function GlobalHeaderLeft() {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="flash" size={16} color="#000" />
            </View>
            <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: 'bold', color: '#fff', letterSpacing: -0.3 }}>
                Grad<Text style={{ color: colors.primary }}>ly</Text>
            </Text>
        </View>
    );
}

function GlobalHeaderRight() {
    const { logout } = useAuth();
    return (
        <TouchableOpacity 
            onPress={logout} 
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 }}
        >
            <Ionicons name="log-out-outline" size={15} color={colors.error} />
            <Text style={{ marginLeft: 4, color: colors.error, fontSize: 12, fontWeight: '600' }}>Logout</Text>
        </TouchableOpacity>
    );
}

const screenOptions = {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: colors.background },
    headerLeft: () => <GlobalHeaderLeft />,
    headerRight: () => <GlobalHeaderRight />,
    headerTitle: '', // Hides default title to make space for custom header layout
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
            <Stack.Screen name="EventsList" component={EventsScreen} />
            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerTitle: 'Event Details', headerLeft: undefined, headerRight: undefined }} />
            <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ headerTitle: 'Create Event', headerLeft: undefined, headerRight: undefined }} />
        </Stack.Navigator>
    );
}

function MessagesStack() {
    return (
        <Stack.Navigator screenOptions={screenOptions}>
            <Stack.Screen name="MessagesList" component={MessagesListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerTitle: 'Chat', headerLeft: undefined, headerRight: undefined }} />
        </Stack.Navigator>
    );
}

function MainTabs() {
    const { hasAnyUnread } = useChat();
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = {
                        Feed: focused ? 'newspaper' : 'newspaper-outline',
                        Jobs: focused ? 'briefcase' : 'briefcase-outline',
                        Events: focused ? 'calendar' : 'calendar-outline',
                        Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
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
            <Tab.Screen name="Feed" component={FeedScreen} options={{ headerTitle: '', headerLeft: () => <GlobalHeaderLeft />, headerRight: () => <GlobalHeaderRight /> }} />
            <Tab.Screen name="Jobs" component={JobsStack} options={{ headerShown: false, title: 'Jobs' }} />
            <Tab.Screen name="Events" component={EventsStack} options={{ headerShown: false, title: 'Events' }} />
            <Tab.Screen 
                name="Messages" 
                component={MessagesStack} 
                options={{ 
                    headerShown: false, 
                    title: 'Messages',
                    tabBarBadge: hasAnyUnread ? '' : undefined,
                    tabBarBadgeStyle: { backgroundColor: colors.primary, minWidth: 10, minHeight: 10 }
                }} 
            />
            <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ headerTitle: '', headerLeft: () => <GlobalHeaderLeft />, headerRight: () => <GlobalHeaderRight /> }} />
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
                <ChatProvider>
                    <RootNavigator />
                </ChatProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

import { registerRootComponent } from 'expo';
registerRootComponent(App);
