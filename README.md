Tule se nahaja nekaj Python skript, povezanih s pridobivanjem, manipulacijo in prikazom podatkov, pridobljenih s spletne strani promet pika si, s katero upravlja državno podjetje DARS.

Pomembne skripte:
- dars_scraper - pridobi dve vektorski ploščici (angl. vector tile) za zajem podatkov o gostoti prometa na območju Ljubljane (11/1106/727 in 11/1106/728, format z/x/y)
- export_data - pripravi datoteke, potrebne za delovanje spletne aplikacije (Parquet datoteke pretvori v JSON datoteke po urah)

Spletna aplikacija se nahaja v direktoriju web, omogoča animiran prikaz gostote prometa v Ljubljani za izbran datum (od 17.4.2026 naprej) z izbiro hitrosti predvajanja.

IMPORTANT NOTE: trenutno je aplikacija narejena tako, da brskalnik prebere dnevno prometno Parquet datoteko, kar traja nekaj sekund. Branje te datoteke sem prestavil na brskalnik zaradi omejitve RAMa na serverju, kjer imam tudi scraper. Ker je zdaj aplikacija ločena od scraperja, si lahko privoščim, da datoteko preberem že prej. To moram še spremeniti.