FROM php:8.2-apache

# Habilitar mod_rewrite para Apache (necessário para reescritas e roteamento)
RUN a2enmod rewrite

# Instalar extensões e drivers PDO necessários para PostgreSQL e MySQL
RUN apt-get update && apt-get install -y libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql

# Copiar os arquivos da pasta backend para o diretório público do Apache
COPY . /var/www/html/

# Configurar permissões padrão
RUN chown -R www-data:www-data /var/www/html

# Porta padrão de escuta do container
EXPOSE 80
