import { data, icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { useState, useCallback } from "react";
import { StyleSheet, Image, View, Text, TextInput, FlatList, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { debounce } from "lodash";
interface Coordinate {
    latitude: number;
    longitude: number;
}

const GoogleTextInput = ({
    icon,
    initialLocation,
    containerStyle,
    textInputBackgroundColor,
    handlePress
}: GoogleInputProps) => {
    
    const [startPoint, setStartPoint] = useState<Coordinate | null>(null);

    const [startQuery, setStartQuery] = useState('');
    const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
    const [endSuggestions, setEndSuggestions] = useState<any[]>([]);

    // Hàm gọi LocationIQ Autocomplete API
    const fetchSuggestions = async (text: string, type: 'start' | 'end') => {
        if (text.length < 3) {
            type === 'start' ? setStartSuggestions([]) : setEndSuggestions([]);
            return;
        }
        
        const url = `https://api.locationiq.com/v1/autocomplete?key=${process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY}&q=${encodeURIComponent(text)}&limit=20`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (Array.isArray(data)) {
                type === 'start' ? setStartSuggestions(data) : setEndSuggestions(data);
            } else {
                console.log('Invalid response from LocationIQ:', data);
            }
        } catch (error) {
            console.log('Error fetching LocationIQ suggestions:', error);
        }
    };
    const debouncedSearch = useCallback(debounce((text: string, type: 'start' | 'end') => fetchSuggestions(text, type), 500), []);

    const handleChange = (text:any, type: 'start' | 'end') => {
        setStartQuery(text);
        debouncedSearch(text, type);
    }
    
    return(
        <View className={`flex flex-row items-center justify-center relative z-50 rounded-xl ${containerStyle} mb-5`}>
            <View className='flex justify-center w-full px-3'>
                <Image 
                    source={icon ? icon : icons.search} 
                    style={styles.autocompleteContainer} 
                    className="ml-5 absolute w-6 h-6 z-50"
                    resizeMode="contain"
                />

                <TextInput
                    placeholder={initialLocation ? initialLocation : 'Bạn muốn đi đâu?'}
                    value={startQuery}
                    onChangeText={(text) => handleChange(text, 'start')}
                    style={styles.textInput}
                    className="relative z-0 pl-10 pr-10 text-xl"
                />
                <TouchableWithoutFeedback onPress={() => {
                    setStartQuery('');
                    setStartSuggestions([]);
                }} className="p-3 bg-blue-300">
                    <Image 
                        source={icons.close} 
                        style={styles.autocompleteContainer}
                        className="absolute h-6 w-6 right-0 mr-5" 
                        resizeMode="contain"
                    />
                </TouchableWithoutFeedback>

                <FlatList
                    className='z-50'
                    data={startSuggestions}
                    // keyExtractor={(item) => item.place_id || item.osm_id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                setStartPoint({ latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) });
                                setStartQuery(item.display_name);
                                setStartSuggestions([]);
                                handlePress({
                                    latitude: parseFloat(item.lat),
                                    longitude: parseFloat(item.lon),
                                    address: item.display_name,
                                })
                            }}
                        >
                            <Text style={styles.suggestionText}>{item.display_name}</Text>
                        </TouchableOpacity>
                    )}
                    style={styles.suggestionList}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    autocompleteContainer: {
        position: 'absolute',
        zIndex: 1000, // Tăng zIndex để nằm trên bản đồ
    },
    autocompleteContainer_End: {
        position: 'absolute',
        top: 60, // Khoảng cách đủ để không đè lên danh sách gợi ý của điểm bắt đầu
        left: 10,
        right: 10,
        zIndex: 900, // Thấp hơn điểm bắt đầu để tránh đè lên danh sách gợi ý
    },
    textInput: {
        height: 70,
        backgroundColor: 'white',
        borderRadius: 10,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        zIndex: 100, // Đảm bảo ô nhập liệu nằm trên danh sách gợi ý
    },
    suggestionList: {
        maxHeight: 200,
        overflow: 'scroll',
        backgroundColor: 'white',
        borderRadius: 5,
        elevation: 5,
        zIndex: 1200, // Cao hơn cả hai ô nhập liệu để hiển thị rõ
        position: 'absolute',
        top: 70, // Đặt ngay dưới ô nhập liệu
        margin: 12,
        left: 0,
        right: 0,
    },
    suggestionText: {
        padding: 10,
        color: '#333',
    },
    info: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        zIndex: 1000,
    },
    error: {
        position: 'absolute',
        top: 110,
        left: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        zIndex: 1000,
    },
});

export default GoogleTextInput;
