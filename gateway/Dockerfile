FROM nginx:alpine

# Remove the default config so only our template is used
RUN rm /etc/nginx/conf.d/default.conf

# The official nginx image processes any *.template file placed in
# /etc/nginx/templates/ using envsubst and writes the result to
# /etc/nginx/conf.d/ before nginx starts. No custom entrypoint needed.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
