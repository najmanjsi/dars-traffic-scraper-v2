Tule se nahaja nekaj Python skript, povezanih s pridobivanjem, manipulacijo in prikazom podatkov, pridobljenih s spletne strani promet.si, s katero upravlja državno podjetje DARS.


Pomembne skripte:
- dars_scraper - pridobi dve vektorski ploščici (angl. vector tile) za zajem podatkov o gostoti prometa na območju Ljubljane (11/1106/727 in 11/1106/728, format z/x/y)
- export_data - pripravi datoteke, potrebne za delovanje spletne aplikacije (Parquet datoteke pretvori v JSON datoteke po urah)


Spletna aplikacija se nahaja v mapi web, omogoča animiran prikaz gostote prometa v Ljubljani za izbran datum (od 17.4.2026 naprej) z izbiro hitrosti predvajanja (1x/2x/4x/10x), načina prikaza (kategorično - 4 kategorije (barve zelena-oranžna-rdeča-temno rdeča), kakor jih ima tudi DARS, ali interpolirano - po teh štirih kategorijah) in pa opcijo prikaza vremena po urah (podatki z [Open-Meteo](https://open-meteo.com/) ali <a href="https://open-meteo.com/" target="blank">Open-Meteo</a>, saj sem na ARSOtu našel arhivske podatke le po dnevih).

IMPORTANT NOTE: Aplikacija seveda ne deluje brez prometnih datotek, ki pa jih tu ni (zaradi velikosti). V bližnji prihodnosti moram dodati še link do tega. Sta pa v mapi traffic/example/ ena Parquet datoteka za cel dan (1.5.2026) in pa ena CSV datoteka taistega dne, a le za enourni interval (od 8:00 do 9:00).

Še en malo manj important note: trenutno je aplikacija narejena tako, da brskalnik prebere dnevno prometno Parquet datoteko, kar traja nekaj sekund. Branje te datoteke sem prestavil na brskalnik zaradi omejitve RAMa na serverju, kjer imam tudi scraper. Ker je zdaj aplikacija ločena od scraperja, si lahko privoščim, da datoteko preberem že prej. To moram še spremeniti.


Za pravilno delovanje skript boš moral verjetno spremeniti nekatere datotečne poti.