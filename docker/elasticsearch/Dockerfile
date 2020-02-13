FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.11

RUN bin/elasticsearch-plugin remove x-pack --purge

# Add your elasticsearch plugins setup here
RUN elasticsearch-plugin install analysis-icu
RUN elasticsearch-plugin install analysis-phonetic
