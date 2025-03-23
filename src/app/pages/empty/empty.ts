import { Component } from '@angular/core';

@Component({
    selector: 'app-empty',
    standalone: true,
    template: ` <div class="card">
        <div class="font-semibold text-xl mb-4">Sobre o projeto PEX</div>
        <p>
        Este projeto é um protótipo de uma aplicação voltada para o registro e gerenciamento de animais em uma fazenda. O objetivo é facilitar a catalogação das informações de cada animal, incluindo sua identificação, raça, idade, peso e sexo. <br><br>

A aplicação busca oferecer uma solução digital para a administração rural, permitindo que os responsáveis pela fazenda tenham um controle mais eficiente sobre seu rebanho. Além disso, a plataforma pode auxiliar na tomada de decisões relacionadas à saúde, reprodução e produtividade dos animais.

Este protótipo faz parte de um projeto de extensão universitária da Descomplica faculdade digital, aplicando conhecimentos adquiridos no curso em um contexto prático e alinhado às necessidades do setor agropecuário. A proposta é desenvolver uma ferramenta acessível, intuitiva e funcional, que possa ser adaptada e expandida conforme as demandas da fazenda e de seus administradores
de forma que facilite para a comunidade rural local o gerenciamento de seus animais com um controle digital, além disso, a proposta visa os proprietários terem uma base estatística de seu rebanho. <br><br>

É importante salientar que esta aplicação consiste apenas em um protótipo, nem todas funcionalidades estão implementadas, a ideia é que se tenha noção da parte de Experiência do usuário com base nas telas de Dashboard, Listagem e Registro. <br><br><br>



Este protótipo foi criado a partir de uma Base do Prime NG, as alterações foram integralmente feitas por Tallys Augusto Gonçalves Cordeiro.
        </p>
    </div>`
})
export class Empty {}
