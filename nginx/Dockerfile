FROM nginx:alpine

# Copy the base Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy all site / virtual-host configurations
COPY nginx/conf.d/*.conf /etc/nginx/conf.d/
