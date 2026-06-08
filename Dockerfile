# Use a lightweight NGINX alpine image to serve static files
FROM nginx:alpine

# Copy the static web files to the default NGINX public directory
COPY . /usr/share/nginx/html

# Expose port 8080 (Cloud Run's default port requirement)
EXPOSE 8080

# Configure NGINX to listen on port 8080 instead of the default port 80
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
