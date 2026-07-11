// src/utils/airports.js

// Маппинг аэропортов к городам
// src/utils/airports.js
export const AIRPORT_TO_CITY = {
  // Российские аэропорты
  'SVO': 'Москва (Шереметьево)',
  'DME': 'Москва (Домодедово)',
  'VKO': 'Москва (Внуково)',
  'LED': 'Санкт-Петербург',
  'SVX': 'Екатеринбург',
  'KZN': 'Казань',
  'UFA': 'Уфа',
  'KGD': 'Калининград',
  'OVB': 'Новосибирск',
  'ROV': 'Ростов-на-Дону',
  'AER': 'Сочи',
  'KRR': 'Краснодар',
  'OMS': 'Омск',
  'CEK': 'Челябинск',
  'KUF': 'Самара',
  'MRV': 'Минеральные Воды',
  'TJM': 'Тюмень',
  'GOJ': 'Нижний Новгород',
  'IJK': 'Ижевск',
  'VOG': 'Волгоград',
  'BQS': 'Благовещенск',
  'VVO': 'Владивосток',
  'KHV': 'Хабаровск',
  'YKS': 'Якутск',
  'MQF': 'Магнитогорск',
  'NJC': 'Нижневартовск',
  'NOZ': 'Новокузнецк',
  'NUX': 'Новый Уренгой',
  'NYM': 'Надым',
  'NYA': 'Нягань',
  'OVS': 'Советский',
  'PEE': 'Пермь',
  'PES': 'Петрозаводск',
  'PKC': 'Петропавловск-Камчатский',
  'PKV': 'Псков',
  'REN': 'Оренбург',
  'RTW': 'Саратов',
  'SCW': 'Сыктывкар',
  'SGC': 'Сургут',
  'SKX': 'Саранск',
  'SLY': 'Салехард',
  'STW': 'Ставрополь',
  'SVO': 'Москва (Шереметьево)',
  'SVX': 'Екатеринбург',
  'TJM': 'Тюмень',
  'TOF': 'Томск',
  'UFA': 'Уфа',
  'ULY': 'Ульяновск',
  'UUD': 'Улан-Удэ',
  'UUS': 'Южно-Сахалинск',
  'VKT': 'Воркута',
  'VVO': 'Владивосток',
  'YKS': 'Якутск',
  'YTY': 'Тюмень (Рощино)',
  
  // Международные аэропорты
  'LHR': 'Лондон (Хитроу)',
  'CDG': 'Париж (Шарль де Голль)',
  'FRA': 'Франкфурт',
  'AMS': 'Амстердам',
  'IST': 'Стамбул',
  'DXB': 'Дубай',
  'AUH': 'Абу-Даби',
  'PEK': 'Пекин',
  'HND': 'Токио (Ханэда)',
  'JFK': 'Нью-Йорк (Кеннеди)',
  'LAX': 'Лос-Анджелес',
  'SIN': 'Сингапур',
  'ICN': 'Сеул (Инчхон)',
  'BKK': 'Бангкок',
  'MUC': 'Мюнхен',
  'ZRH': 'Цюрих',
  'VIE': 'Вена',
  'PRG': 'Прага',
  'WAW': 'Варшава',
  'HEL': 'Хельсинки',
  'ARN': 'Стокгольм',
  'CPH': 'Копенгаген',
  'OSL': 'Осло',
};
export const MIN_FLIGHT_TIMES = {
  // Москва -> другие города
  "SVO-LED": 1.5,   // Москва - Санкт-Петербург
  "DME-LED": 1.5,
  "VKO-LED": 1.5,
  "SVO-AER": 2,     // Москва - Сочи
  "DME-AER": 2,
  "SVO-SVX": 2.5,   // Москва - Екатеринбург
  "SVO-KJA": 4.5,   // Москва - Красноярск
  "SVO-OVB": 4,     // Москва - Новосибирск
  "SVO-KHV": 9,     // Москва - Хабаровск
  "SVO-VVO": 10,    // Москва - Владивосток
  
  // Санкт-Петербург -> другие города
  "LED-AER": 3,     // СПб - Сочи
  "LED-SVX": 3,     // СПб - Екатеринбург
  "LED-KJA": 5.5,   // СПб - Красноярск
  "LED-VVO": 11,    // СПб - Владивосток
  
  // Международные рейсы
  "SVO-IST": 3.5,   // Москва - Стамбул
  "SVO-LHR": 4,     // Москва - Лондон
  "SVO-JFK": 10,    // Москва - Нью-Йорк
  "LED-IST": 3,     // СПб - Стамбул
  "LED-LHR": 3.5,   // СПб - Лондон
  
  // Сочи -> другие города
  "AER-SVX": 3,     // Сочи - Екатеринбург
  "AER-LED": 3,     // Сочи - СПб
};

// Функция для получения минимального времени полёта между аэропортами
export function getMinFlightHours(depCode, arrCode) {
  const directKey = `${depCode}-${arrCode}`;
  if (MIN_FLIGHT_TIMES[directKey]) {
    return MIN_FLIGHT_TIMES[directKey];
  }
  
  const reverseKey = `${arrCode}-${depCode}`;
  if (MIN_FLIGHT_TIMES[reverseKey]) {
    return MIN_FLIGHT_TIMES[reverseKey];
  }
  
  // Если маршрут неизвестен, возвращаем значение по умолчанию
  const depCountry = isRussianAirport(depCode) ? 'RU' : 'INT';
  const arrCountry = isRussianAirport(arrCode) ? 'RU' : 'INT';
  
  if (depCountry === 'RU' && arrCountry === 'RU') {
    return 1.5; // Внутренние рейсы в России
  } else if (depCountry === 'RU' || arrCountry === 'RU') {
    return 3;   // Международные рейсы из/в Россию
  } else {
    return 2;   // Международные рейсы между другими странами
  }
}

// Проверка, является ли аэропорт российским
function isRussianAirport(code) {
  const russianAirports = ['SVO', 'DME', 'VKO', 'LED', 'AER', 'SVX', 'KJA', 'OVB', 'KHV', 'VVO'];
  return russianAirports.includes(code);
}

// Функция для расчёта продолжительности полёта в минутах
export function getFlightDurationMinutes(departureTime, arrivalTime) {
  const dep = new Date(departureTime);
  const arr = new Date(arrivalTime);
  return Math.round((arr - dep) / (1000 * 60));
}

// Обратное преобразование (город -> коды аэропортов)
export const CITY_TO_AIRPORTS = {
  'Москва': ['SVO', 'DME', 'VKO'],
  'Санкт-Петербург': ['LED'],
  'Екатеринбург': ['SVX'],
  'Новосибирск': ['OVB'],
  'Казань': ['KZN'],
  'Сочи': ['AER'],
  'Краснодар': ['KRR'],
  // Добавьте другие города по необходимости
};

// Функция для получения города по коду аэропорта
export function getCityByAirportCode(code) {
  return AIRPORT_TO_CITY[code] || code;
}

// Функция для получения кодов аэропортов по городу
export function getAirportsByCity(city) {
  return CITY_TO_AIRPORTS[city] || [];
}
