# Etapa única: usar Nginx para servir o dist já pronto
FROM nginx:alpine

# Remove os arquivos padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos do dist (já gerados na sua máquina)
# Ajuste o nome do projeto conforme aparece dentro de dist/
COPY ../dist/sakai-ng/browser/ /usr/share/nginx/html/
COPY ../nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html


# (Opcional) Copiar configuração customizada do Nginx para rotas Angular
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
