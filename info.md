# Lovelace custom card for Garbage Collection

This Lovelace custom card displays garbage collection information provided by
the Gartbage Collection custom component you may find at
[https://github.com/bruxy70/Garbage-Collection](https://github.com/bruxy70/Garbage-Collection/).
It will draw your attention the day before the garbage collection by changing the icon color to red.

Lovelace UI does not support platform attributes natively.<br />
Implementation was inspired by [entity-attributes-card](https://github.com/custom-cards/entity-attributes-card)
on handling attributes in Lovelace.

#### Installation
The easiest way to install it is through [HACS (Home Assistant Community Store)](https://custom-components.github.io/hacs/),
search for <i>garbage</i> and select Garbage Collection Card from Plugins.<br />
If you are not using HACS, you may download garbage-collection-card.js and put it into $homeassistant_config_dir/www.<br />

#### Lovelace UI configuration
Add the following lines to your ui-lovelace.yaml (entity should be the sensor of garbage_collection platform you defined):
```
resources:
  - {type: module, url: '/www/community/garbage-collection-card/garbage-collection-card.js'}

    cards:
      - type: custom:garbage-collection-card
        entity: sensor.waste
      - type: custom:garbage-collection-card
        entity: sensor.selective_waste
```

Lovelace UI:<br />
![Garbage Collection card example](garbage_collection_lovelace.jpg)
