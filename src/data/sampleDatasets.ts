/**
 * Correlation Atlas - Curated Datasets for Statistical Research & Demonstration
 */

export interface SampleDataset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  category: 'paradox' | 'classic' | 'spurious' | 'real-world';
  defaultX: string;
  defaultY: string;
  defaultGroup?: string;
  csv: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'penguins',
    name: '南蠻企鵝形態學 (Palmer Penguins)',
    nameEn: 'Palmer Penguins Morphology',
    description: '展示著名的辛普森悖論 (Simpson’s Paradox)：整體觀察時喙長度與喙深度呈現負相關，但依物種 (Adelie, Chinstrap, Gentoo) 分組時，各組內部皆為顯著正相關！',
    category: 'paradox',
    defaultX: 'bill_length_mm',
    defaultY: 'bill_depth_mm',
    defaultGroup: 'species',
    csv: `species,island,bill_length_mm,bill_depth_mm,flipper_length_mm,body_mass_g,sex
Adelie,Torgersen,39.1,18.7,181,3750,MALE
Adelie,Torgersen,39.5,17.4,186,3800,FEMALE
Adelie,Torgersen,40.3,18.0,195,3250,FEMALE
Adelie,Torgersen,36.7,19.3,193,3450,FEMALE
Adelie,Torgersen,39.3,20.6,190,3650,MALE
Adelie,Torgersen,38.9,17.8,181,3625,FEMALE
Adelie,Torgersen,39.2,19.6,195,4675,MALE
Adelie,Torgersen,34.1,18.1,193,3475,null
Adelie,Torgersen,42.0,20.2,190,4250,null
Adelie,Torgersen,37.8,17.1,186,3300,null
Adelie,Torgersen,37.8,17.3,180,3700,null
Adelie,Torgersen,41.1,17.6,182,3200,FEMALE
Adelie,Torgersen,38.6,21.2,191,3800,MALE
Adelie,Torgersen,34.6,21.1,198,4400,MALE
Adelie,Torgersen,36.6,17.8,185,3700,FEMALE
Adelie,Torgersen,38.7,19.0,195,3450,FEMALE
Adelie,Torgersen,42.5,20.7,197,4500,MALE
Adelie,Torgersen,34.4,18.4,184,3325,FEMALE
Adelie,Torgersen,46.0,21.5,194,4200,MALE
Adelie,Biscoe,37.8,18.3,174,3400,FEMALE
Adelie,Biscoe,37.7,18.7,180,3600,MALE
Adelie,Biscoe,35.9,19.2,189,3800,FEMALE
Adelie,Biscoe,38.2,18.9,185,3950,MALE
Adelie,Biscoe,38.8,17.2,180,3800,MALE
Adelie,Biscoe,35.3,18.9,187,3800,FEMALE
Adelie,Biscoe,40.6,18.6,183,3550,MALE
Adelie,Biscoe,40.5,17.9,187,3200,FEMALE
Adelie,Biscoe,37.9,18.6,172,3150,FEMALE
Adelie,Biscoe,40.5,18.9,180,3950,MALE
Adelie,Dream,39.5,16.7,178,3250,FEMALE
Adelie,Dream,37.2,18.1,178,3900,MALE
Adelie,Dream,39.5,17.8,188,3300,FEMALE
Adelie,Dream,40.9,18.9,184,3900,MALE
Adelie,Dream,36.4,17.0,195,3675,FEMALE
Adelie,Dream,39.2,21.1,196,4150,MALE
Adelie,Dream,38.8,20.0,190,3950,MALE
Adelie,Dream,42.2,18.5,180,3550,FEMALE
Adelie,Dream,37.6,19.3,181,3300,FEMALE
Adelie,Dream,39.8,19.1,184,4650,MALE
Gentoo,Biscoe,46.1,13.2,211,4500,FEMALE
Gentoo,Biscoe,50.0,16.3,230,5700,MALE
Gentoo,Biscoe,48.7,14.1,210,4450,FEMALE
Gentoo,Biscoe,50.0,15.2,218,5700,MALE
Gentoo,Biscoe,47.6,14.5,215,5400,MALE
Gentoo,Biscoe,46.5,13.5,210,4550,FEMALE
Gentoo,Biscoe,45.4,14.6,211,4800,FEMALE
Gentoo,Biscoe,46.7,15.3,219,5200,MALE
Gentoo,Biscoe,43.3,13.4,209,4400,FEMALE
Gentoo,Biscoe,46.8,15.4,215,5150,MALE
Gentoo,Biscoe,40.9,13.7,214,4650,FEMALE
Gentoo,Biscoe,49.0,16.1,216,5550,MALE
Gentoo,Biscoe,45.5,13.7,214,4650,FEMALE
Gentoo,Biscoe,48.4,14.6,213,5850,MALE
Gentoo,Biscoe,45.8,14.6,210,4200,FEMALE
Gentoo,Biscoe,49.3,15.7,217,5850,MALE
Gentoo,Biscoe,42.0,13.5,210,4150,FEMALE
Gentoo,Biscoe,49.2,15.2,221,6300,MALE
Gentoo,Biscoe,46.2,14.5,209,4800,FEMALE
Gentoo,Biscoe,48.7,15.1,222,5350,MALE
Gentoo,Biscoe,50.2,14.3,218,5700,MALE
Gentoo,Biscoe,45.1,14.5,215,5000,FEMALE
Gentoo,Biscoe,46.5,14.5,213,4400,FEMALE
Gentoo,Biscoe,46.3,15.8,215,5050,MALE
Gentoo,Biscoe,42.9,13.1,215,5000,FEMALE
Gentoo,Biscoe,46.1,15.1,215,5100,MALE
Chinstrap,Dream,46.5,17.9,192,3500,FEMALE
Chinstrap,Dream,50.0,19.5,196,3900,MALE
Chinstrap,Dream,51.3,19.2,197,3650,MALE
Chinstrap,Dream,45.4,18.7,188,3525,FEMALE
Chinstrap,Dream,52.7,19.8,197,3725,MALE
Chinstrap,Dream,45.2,17.8,198,3950,FEMALE
Chinstrap,Dream,46.1,18.2,178,3250,FEMALE
Chinstrap,Dream,51.3,18.2,197,3750,MALE
Chinstrap,Dream,46.0,18.9,195,4150,FEMALE
Chinstrap,Dream,51.3,19.9,198,3700,MALE
Chinstrap,Dream,46.6,17.8,193,3800,FEMALE
Chinstrap,Dream,51.7,20.3,194,3775,MALE
Chinstrap,Dream,47.0,17.3,185,3700,FEMALE
Chinstrap,Dream,52.0,18.1,201,4050,MALE
Chinstrap,Dream,45.9,17.1,190,3575,FEMALE
Chinstrap,Dream,50.5,19.6,201,4050,MALE
Chinstrap,Dream,50.3,20.0,197,3800,MALE
Chinstrap,Dream,58.0,17.8,181,3700,FEMALE
Chinstrap,Dream,46.4,18.6,189,3450,FEMALE
Chinstrap,Dream,49.2,18.2,195,4400,MALE
Chinstrap,Dream,42.4,17.3,181,3600,FEMALE
Chinstrap,Dream,48.5,17.5,191,3400,MALE
Chinstrap,Dream,55.8,19.8,207,4000,MALE`,
  },
  {
    id: 'anscombe',
    name: '安斯庫姆四重奏 (Anscombe’s Quartet)',
    nameEn: "Anscombe's Quartet",
    description: '統計學歷史上的傳奇數據：四組迥然相異的資料點，卻擁有近乎完全相同的平均數 (X=9, Y=7.5)、方差 (11 & 4.12)、相關係數 (r≈0.816) 與回歸直線 (y=3+0.5x)！視覺化不可或缺的最佳證明。',
    category: 'classic',
    defaultX: 'x1',
    defaultY: 'y1',
    defaultGroup: 'dataset_name',
    csv: `dataset_name,x1,y1,x2,y2,x3,y3,x4,y4
Set_I,10,8.04,10,9.14,10,7.46,8,6.58
Set_I,8,6.95,8,8.14,8,6.77,8,5.76
Set_I,13,7.58,13,8.74,13,12.74,8,7.71
Set_I,9,8.81,9,8.77,9,7.11,8,8.84
Set_I,11,8.33,11,9.26,11,7.81,8,8.47
Set_I,14,9.96,14,8.10,14,8.84,8,7.04
Set_I,6,7.24,6,6.13,6,6.08,8,5.25
Set_I,4,4.26,4,3.10,4,5.39,19,12.50
Set_I,12,10.84,12,9.13,12,8.15,8,5.56
Set_I,7,4.82,7,7.26,7,6.42,8,7.91
Set_I,5,5.68,5,4.74,5,5.73,8,6.89`,
  },
  {
    id: 'spurious_icecream',
    name: '荒謬相關：冰淇淋、氣溫與溺水 (Confounding Variable)',
    nameEn: 'Spurious Correlation: Ice Cream vs Drownings',
    description: '「相關不代表因果」的代表範例：冰淇淋銷量與溺水事故率高度正相關 (r > 0.85)，但真實的根本原因並非吃冰導致溺水，而是「氣溫」這個潛在干擾變數 (Lurking / Confounder) 同時推高了兩者！',
    category: 'spurious',
    defaultX: 'ice_cream_sales_k',
    defaultY: 'drowning_accidents',
    defaultGroup: 'season',
    csv: `month,temperature_c,ice_cream_sales_k,drowning_accidents,shark_sightings,electricity_mwh,season
Jan,12.5,14.2,4,1,850,Winter
Feb,13.8,16.5,5,1,810,Winter
Mar,17.2,22.0,8,2,760,Spring
Apr,20.4,29.8,11,3,720,Spring
May,24.1,38.5,18,5,790,Spring
Jun,28.6,52.1,28,9,940,Summer
Jul,32.4,68.4,42,14,1150,Summer
Aug,33.1,71.2,45,15,1190,Summer
Sep,27.5,46.3,22,7,890,Autumn
Oct,22.0,31.0,12,4,740,Autumn
Nov,16.8,19.8,7,2,780,Autumn
Dec,13.0,15.1,4,1,840,Winter
Jan_Y2,11.8,13.0,3,0,870,Winter
Feb_Y2,14.2,17.1,6,1,800,Winter
Mar_Y2,18.0,24.2,9,2,750,Spring
Apr_Y2,21.5,32.0,13,4,730,Spring
May_Y2,25.3,41.2,20,6,810,Spring
Jun_Y2,29.8,56.0,31,10,980,Summer
Jul_Y2,33.5,74.0,48,16,1220,Summer
Aug_Y2,34.0,76.5,49,17,1260,Summer
Sep_Y2,28.2,49.0,24,8,910,Autumn
Oct_Y2,23.1,33.5,14,4,760,Autumn
Nov_Y2,17.5,21.0,8,2,790,Autumn
Dec_Y2,12.2,14.0,4,1,860,Winter`,
  },
  {
    id: 'iris',
    name: '鳶尾花形態量測 (Iris Flower Dataset)',
    nameEn: 'Fisher’s Iris Dataset',
    description: 'Ronald Fisher 於 1936 年發表的經典多變數資料集，包含三種鳶尾花 (Setosa, Versicolor, Virginica) 的花萼與花瓣長寬，適合觀察群體分佈與多變數相關矩陣。',
    category: 'classic',
    defaultX: 'petal_length',
    defaultY: 'petal_width',
    defaultGroup: 'species',
    csv: `sepal_length,sepal_width,petal_length,petal_width,species
5.1,3.5,1.4,0.2,setosa
4.9,3.0,1.4,0.2,setosa
4.7,3.2,1.3,0.2,setosa
4.6,3.1,1.5,0.2,setosa
5.0,3.6,1.4,0.2,setosa
5.4,3.9,1.7,0.4,setosa
4.6,3.4,1.4,0.3,setosa
5.0,3.4,1.5,0.2,setosa
4.4,2.9,1.4,0.2,setosa
4.9,3.1,1.5,0.1,setosa
5.4,3.7,1.5,0.2,setosa
4.8,3.4,1.6,0.2,setosa
4.8,3.0,1.4,0.1,setosa
4.3,3.0,1.1,0.1,setosa
5.8,4.0,1.2,0.2,setosa
5.7,4.4,1.5,0.4,setosa
5.4,3.9,1.3,0.4,setosa
5.1,3.5,1.4,0.3,setosa
5.7,3.8,1.7,0.3,setosa
5.1,3.8,1.5,0.3,setosa
7.0,3.2,4.7,1.4,versicolor
6.4,3.2,4.5,1.5,versicolor
6.9,3.1,4.9,1.5,versicolor
5.5,2.3,4.0,1.3,versicolor
6.5,2.8,4.6,1.5,versicolor
5.7,2.8,4.5,1.3,versicolor
6.3,3.3,4.7,1.6,versicolor
4.9,2.4,3.3,1.0,versicolor
6.6,2.9,4.6,1.3,versicolor
5.2,2.7,3.9,1.4,versicolor
5.0,2.0,3.5,1.0,versicolor
5.9,3.0,4.2,1.5,versicolor
6.0,2.2,4.0,1.0,versicolor
6.1,2.9,4.7,1.4,versicolor
5.6,2.9,3.6,1.3,versicolor
6.7,3.1,4.4,1.4,versicolor
5.6,3.0,4.5,1.5,versicolor
5.8,2.7,4.1,1.0,versicolor
6.2,2.2,4.5,1.5,versicolor
5.6,2.5,3.9,1.1,versicolor
6.3,3.3,6.0,2.5,virginica
5.8,2.7,5.1,1.9,virginica
7.1,3.0,5.9,2.1,virginica
6.3,2.9,5.6,1.8,virginica
6.5,3.0,5.8,2.2,virginica
7.6,3.0,6.6,2.1,virginica
4.9,2.5,4.5,1.7,virginica
7.3,2.9,6.3,1.8,virginica
6.7,2.5,5.8,1.8,virginica
7.2,3.6,6.1,2.5,virginica
6.5,3.2,5.1,2.0,virginica
6.4,2.7,5.3,1.9,virginica
6.8,3.0,5.5,2.1,virginica
5.7,2.5,5.0,2.0,virginica
5.8,2.8,5.1,2.4,virginica
6.4,3.2,5.3,2.3,virginica
6.5,3.0,5.5,1.8,virginica
7.7,3.8,6.7,2.2,virginica
7.7,2.6,6.9,2.3,virginica
6.0,2.2,5.0,1.5,virginica`,
  },
  {
    id: 'happiness',
    name: '世界各國幸福感與經濟健康指標 (World Happiness)',
    nameEn: 'World Happiness & Macro Indicators',
    description: '收錄全球各國的幸福評分、人均 GDP、社會支持度、預期健康壽命、自由度與貪腐感知，適合探索宏觀社會學變數之間的深層統計關聯。',
    category: 'real-world',
    defaultX: 'gdp_per_capita',
    defaultY: 'happiness_score',
    defaultGroup: 'region',
    csv: `country,region,happiness_score,gdp_per_capita,social_support,healthy_life_expectancy,freedom,generosity,corruption_perception
Finland,Western Europe,7.80,1.88,1.58,0.77,0.85,0.14,0.53
Denmark,Western Europe,7.58,1.94,1.53,0.77,0.83,0.21,0.51
Iceland,Western Europe,7.52,1.92,1.62,0.80,0.80,0.27,0.19
Sweden,Western Europe,7.34,1.92,1.51,0.78,0.81,0.22,0.49
Israel,Middle East,7.34,1.82,1.50,0.81,0.61,0.16,0.19
Netherlands,Western Europe,7.31,1.96,1.48,0.76,0.76,0.24,0.42
Norway,Western Europe,7.30,1.99,1.54,0.78,0.83,0.22,0.47
Switzerland,Western Europe,7.06,1.98,1.43,0.82,0.78,0.18,0.47
Luxembourg,Western Europe,7.12,2.17,1.41,0.79,0.78,0.15,0.43
Australia,Oceania,7.05,1.90,1.49,0.77,0.76,0.23,0.36
New Zealand,Oceania,7.02,1.85,1.52,0.76,0.76,0.24,0.47
Costa Rica,Latin America,6.95,1.58,1.44,0.75,0.77,0.11,0.13
Austria,Western Europe,6.90,1.93,1.42,0.77,0.73,0.18,0.34
Canada,North America,6.90,1.88,1.48,0.77,0.74,0.20,0.37
United States,North America,6.72,1.99,1.39,0.69,0.64,0.21,0.18
Germany,Western Europe,6.71,1.92,1.42,0.76,0.68,0.16,0.36
United Kingdom,Western Europe,6.74,1.86,1.43,0.76,0.67,0.26,0.35
Singapore,East Asia,6.52,2.14,1.37,0.85,0.76,0.18,0.56
Taiwan,East Asia,6.50,1.87,1.38,0.74,0.66,0.10,0.20
Japan,East Asia,6.12,1.82,1.41,0.84,0.64,0.01,0.23
South Korea,East Asia,6.05,1.85,1.25,0.82,0.56,0.11,0.16
Brazil,Latin America,6.27,1.45,1.39,0.64,0.66,0.14,0.11
Mexico,Latin America,6.67,1.57,1.32,0.65,0.72,0.09,0.12
South Africa,Sub-Saharan Africa,5.27,1.37,1.29,0.36,0.53,0.10,0.06
India,South Asia,4.05,1.15,0.66,0.47,0.73,0.18,0.13`,
  },
  {
    id: 'marketing',
    name: '多通路行銷預算與產品營收 (Marketing Spend & ROI)',
    nameEn: 'Omnichannel Marketing & Revenue',
    description: '涵蓋電視、廣播、數位社群媒體廣告支出與實體通路的產品總銷售額，適合進行多變數相關矩陣評估與回歸分析。',
    category: 'real-world',
    defaultX: 'social_media_budget',
    defaultY: 'sales_revenue',
    defaultGroup: 'tier',
    csv: `channel_id,tv_budget,radio_budget,social_media_budget,in_store_promo,sales_revenue,tier
1,230.1,37.8,69.2,15.2,22.1,Tier_1
2,44.5,39.3,45.1,10.0,10.4,Tier_3
3,17.2,45.9,69.3,8.4,9.3,Tier_3
4,151.5,41.3,58.5,14.6,18.5,Tier_2
5,180.8,10.8,58.4,12.0,12.9,Tier_2
6,8.7,48.9,75.0,5.1,7.2,Tier_3
7,57.5,32.8,23.5,9.8,11.8,Tier_3
8,120.2,19.6,11.6,11.2,13.2,Tier_2
9,8.6,2.1,1.0,4.2,4.8,Tier_3
10,199.8,2.6,21.2,12.5,10.6,Tier_2
11,66.1,5.8,24.2,8.0,8.6,Tier_3
12,214.7,24.0,4.0,16.5,17.4,Tier_1
13,23.8,35.1,65.9,7.8,9.2,Tier_3
14,97.5,7.6,7.2,9.0,9.7,Tier_3
15,204.1,32.9,46.0,17.1,19.0,Tier_1
16,195.4,47.7,52.9,18.0,22.4,Tier_1
17,67.8,36.6,114.0,11.0,12.5,Tier_3
18,281.4,39.6,55.8,21.0,24.4,Tier_1
19,69.2,20.5,18.3,8.9,11.3,Tier_3
20,147.3,23.9,19.1,12.4,14.6,Tier_2
21,218.4,27.7,53.4,18.5,18.0,Tier_1
22,237.4,5.1,23.5,14.2,12.5,Tier_1
23,13.2,15.9,49.6,6.0,5.6,Tier_3
24,228.3,16.9,26.2,16.0,15.5,Tier_1
25,62.3,12.6,18.3,7.5,9.7,Tier_3`,
  },
];
