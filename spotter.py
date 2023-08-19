from flask import Flask, request, jsonify, render_template, redirect, url_for
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.wait import WebDriverWait
from selenium.common.exceptions import NoSuchElementException, TimeoutException, ElementNotInteractableException
from tqdm import tqdm_notebook as tqdmn
import pandas as pd
import numpy as np
import folium
import time
import re
import math

from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


from selenium import webdriver

options = webdriver.ChromeOptions()
options.add_argument("--headless=new")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))  # options=options)
wait = WebDriverWait(driver, timeout=6)


def distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in kilometers
    earth_radius_km = 6371.0
    lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    # Convert latitude and longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Calculate the differences between the latitudes and longitudes
    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    # Calculate the haversine distance
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * \
        math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance_km = earth_radius_km * c

    return round(distance_km, 3)

# input_list is list of score each location got.
# rank the locations based on that score in descending order.


def generate_rank(input_list):
    l = len(input_list)
    newl = input_list.copy()
    newl.sort()
    rank = [newl.index(i)+1 for i in input_list]
    return rank


def find_similar_business(typ, city='', lato='', lono='', count=10):
    if city != '':
        city = '+in+'+city

    if lato == '' or lono == '':
        url = 'https://www.google.com/maps/search/' + typ + city

    else:
        url = 'https://www.google.com/maps/search/' + \
            typ + city + '/@' + lato + ',' + lono

    # dict to store similar business details, of the format business name: [lat, lon, rating, votes]
    simbus = dict()

    # Opening the search URL. You'll notice a chrome window opening :
    driver.get(url)

    wait.until(lambda x: x.find_element(By.CLASS_NAME, "hfpxzc"))

    shops = driver.find_elements(By.CLASS_NAME, "hfpxzc")

# Scraping details from the map page by attribute names
    while len(shops) < count:       # should be more, like 20
        shops = driver.find_elements(By.CLASS_NAME, "hfpxzc")
        last_shop = shops[-1]
        driver.execute_script("arguments[0].scrollIntoView(true);", last_shop)
        time.sleep(3)

    for i in shops:
        name = i.get_attribute("aria-label").strip()
        simbus[name] = []       # similar business dictionary
        link = i.get_attribute('href')
        lat = link[link.index('!3d')+3:link.index('!3d')+13]
        lat = lat.split('!')[0]
        lon = link[link.index('!4d')+3:link.index('!4d')+13]
        lon = lon.split('!')[0]
        simbus[name] = [lat, lon, link]

    
    #print(simbus)

    for j in simbus:
        try:
            driver.get(simbus[j][2])
            #time.sleep(3)
            print(j)

            # print(simbus[j][0],simbus[j][1])

            # get the rating of each shops
            rating = driver.find_element(
                By.XPATH, "//*[@class='F7nice ']/span/span").text
            # print(rating)

            # dist = distance(lato,lono,simbus[j][0],simbus[j][1])
            # print('distance: ',dist)

            votes = driver.find_element(
                By.XPATH, "//*[@class='F7nice ']/span[2]/span/span").text[1:-1]
            # print(votes)

            simbus[j].pop()
            simbus[j].append(rating)
            simbus[j].append(votes)
            print(j, simbus[j])
            

        except Exception as e:
            if 'http' in simbus[j][2] and len(simbus) == 3:
                simbus[j].pop()
            print('error: ', e)
            pass
    # print(simbus)
    return simbus


business_type = 'restaurant'
city = 'koduvally'
lato = '11.357237'
lono = '75.911491'
scale = '15'    # add at the end of url after comma


# print(find_similar_business(typ=business_type, city=city, lato=lato, lono=lono))


locations = [{'lat': 12.063, 'lng': 76.731}, {
    'lat': 18.932, 'lng': 81.897}]


def spotter(typ, city, locations, count=5):
    lato = 0
    lono = 0

    # Iterate through each dictionary in the location list
    for coord in locations:
        # Get the coordinates from the current dictionary
        lat, lon = coord['lat'], coord['lng']
        # Add the latitude and longitude values to the respective totals
        lato += lat
        lono += lon

    total = len(locations)
    lato = lato / total
    lono = lono / total

    # list contain numbers that denote the competiveness of each location.
    # less the number good location to start the bussiness
    total_distance = []

    # get the similar businesses in the area
    similar_businesses = find_similar_business(
        typ=typ,
        city=city,
        lato=str(lato),
        lono=str(lono),
        count=count
    )

    # Iterate through each dictionary in the locations list
    for coord in locations:
        weighted_rank = 0
        # Get the coordinates from the current dictionary
        lat1, lon1 = coord['lat'], coord['lng']

        # Call find_similar_business function to get similar businesses in the city
        try:
            # Calculate the distance from every similar business to the current coordinate
            for business in similar_businesses:
                lat2, lon2 = similar_businesses[business][0], similar_businesses[business][1]
                dist = distance(lat1, lon1, lat2, lon2)
                # weight is weight of each similar business, it is calculated by rating*no of rating/distance
                weight = float(similar_businesses[business][2].replace(',', '')) * \
                    int(similar_businesses[business][3].replace(',', ''))/dist
                weighted_rank += weight

            total_distance.append(weighted_rank)
        except Exception as e:
            print('error :', e)
            pass

    # print(generate_rank(total_distance))
    # print(total_distance)
    # Return the total sum of distances
    return generate_rank(total_distance), similar_businesses


# print(spotter(typ='Restaurant', city='Koduvally', locations=locations))


# print(spotter(typ='Restaurant', city='Kochi', locations=locations, count=5))
