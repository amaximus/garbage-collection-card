<p><a href="https://www.buymeacoffee.com/6rF5cQl" rel="nofollow" target="_blank"><img src="https://camo.githubusercontent.com/c070316e7fb193354999ef4c93df4bd8e21522fa/68747470733a2f2f696d672e736869656c64732e696f2f7374617469632f76312e7376673f6c6162656c3d4275792532306d6525323061253230636f66666565266d6573736167653d25463025394625413525413826636f6c6f723d626c61636b266c6f676f3d6275792532306d6525323061253230636f66666565266c6f676f436f6c6f723d7768697465266c6162656c436f6c6f723d366634653337" alt="Buy me a coffee" data-canonical-src="https://img.shields.io/static/v1.svg?label=Buy%20me%20a%20coffee&amp;message=%F0%9F%A5%A8&amp;color=black&amp;logo=buy%20me%20a%20coffee&amp;logoColor=white&amp;labelColor=b0c4de" style="max-width:100%;"></a></p>

# Lovelace custom card for Garbage Collection

This Lovelace custom card displays garbage collection information provided by
the Garbage Collection custom component you may find at
[https://github.com/bruxy70/Garbage-Collection](https://github.com/bruxy70/Garbage-Collection/).<br />
It will draw your attention the day before the garbage collection by changing the icon color to red by default.

Lovelace UI does not support platform attributes natively.<br />
Implementation of handling attributes in Lovelace was inspired by [entity-attributes-card](https://github.com/custom-cards/entity-attributes-card).

#### Installation
The easiest way to install it is through [HACS (Home Assistant Community Store)](https://custom-components.github.io/hacs/),
search for <i>garbage</i> and select Garbage Collection Card from Plugins.<br />
If you are not using HACS, you may download garbage-collection-card.js and the translations directory and put them into
homeassistant_config_dir/www/community/garbage-collection-card/ directory.<br />

#### Lovelace UI configuration
Configuration parameters:<br />
<p>
**entity** (required): name of the sensor of garbage_collection platform.<br />
**due_color** (optional): icon color on due date. Accepts both color names and RGB values. Defaults to red.<br />
**due_1_color** (optional): icon color on the day before due date. Accepts both color names and RGB values. Defaults to due_color.<br />
**icon_color** (optional): icon color. Accepts both color names and RGB values. Defaults to black.<br />
**icon_size** (optional): size of the icon. Defaults to 25px.<br />
**hide_date** (optional): hide date. Defaults to false.<br />
**hide_days** (optional): hide number of days. Defaults to false.<br />
**hide_before** (optional): hide entire card until x days before event.  Defaults to not hiding card.<br />
**title_size** (optional): font size for the sensor's friendly name.  Defaults to 17px.<br />
**details_size** (optional): font size for date and number of days.  Defaults to 14px.<br />
<p>
When garbage-collection sensors are used with verbose_state=True, hide_date and hide_days will be discarded,
taking the information from the sensor's verbose_format.
<p>
Please find below an example of ui-lovelace.yaml (entity should be the sensor of garbage_collection platform you defined):

```
resources:
  *When using HACS installation method
  - {type: js, url: '/community_plugin/garbage-collection-card/garbage-collection-card.js'}
  *When using manual install method
  - {type: js, url: '/local/garbage-collection-card.js'}
    cards:
      - type: custom:garbage-collection-card
        entity: sensor.selective_waste
        icon_size: 35px
        icon_color: green
        hide_date: true
      - type: custom:garbage-collection-card
        entity: sensor.waste
        hide_before: 4
        icon_color: '#0561ba'
```

Basic card:<br />
![Garbage Collection card example](garbage_collection_lovelace.jpg)

Different icon sizes and colors:<br />
![Different icon sizes](garbage_collection_difsize.jpg)

