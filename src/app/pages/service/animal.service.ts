import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type AnimalSexo = 'Macho' | 'Femea';
export type AnimalTipo = 'Vaca' | 'Boi' | 'Bezerro' | 'Bezerra' | 'Novilha' | 'Garrote';
export type AnimalStatus = 'Saudavel' | 'Em observacao' | 'Prenha' | 'Vendido';
export type DataSourceMode = 'json-server' | 'local';

export interface AnimalRecord {
    id?: string;
    nome: string;
    identificacao: string;
    tipo: AnimalTipo;
    sexo: AnimalSexo;
    raca: string;
    peso: number;
    valor: number;
    dataNascimento: string;
    status: AnimalStatus;
    observacoes: string;
    fotoUrl: string;
    createdAt: string;
}

export interface AnimalStats {
    total: number;
    machos: number;
    femeas: number;
    valorTotal: number;
}

export const ANIMAL_TYPE_OPTIONS: { label: string; value: AnimalTipo }[] = [
    { label: 'Vaca', value: 'Vaca' },
    { label: 'Boi', value: 'Boi' },
    { label: 'Bezerro', value: 'Bezerro' },
    { label: 'Bezerra', value: 'Bezerra' },
    { label: 'Novilha', value: 'Novilha' },
    { label: 'Garrote', value: 'Garrote' }
];

export const ANIMAL_STATUS_OPTIONS: { label: string; value: AnimalStatus }[] = [
    { label: 'Saudavel', value: 'Saudavel' },
    { label: 'Em observacao', value: 'Em observacao' },
    { label: 'Prenha', value: 'Prenha' },
    { label: 'Vendido', value: 'Vendido' }
];

export const ANIMAL_SEX_OPTIONS: { label: string; value: AnimalSexo }[] = [
    { label: 'Macho', value: 'Macho' },
    { label: 'Femea', value: 'Femea' }
];

const LOCAL_STORAGE_KEY = 'pex.animals.v2';
const LOCAL_API_BASE_URL = 'http://localhost:3000';
const FALLBACK_IMAGE = 'assets/img/bezerro-1.png';

const seedAnimals: AnimalRecord[] = [
    {
        id: 'a-1001',
        nome: 'Estrela',
        identificacao: 'VAC-014',
        tipo: 'Vaca',
        sexo: 'Femea',
        raca: 'Nelore',
        peso: 482,
        valor: 8500,
        dataNascimento: '2021-08-18',
        status: 'Prenha',
        observacoes: 'Matriz com bom historico de reproducao.',
        fotoUrl: 'assets/img/bezerro-2.png',
        createdAt: '2026-03-09T10:00:00.000Z'
    },
    {
        id: 'a-1002',
        nome: 'Trovao',
        identificacao: 'BOI-022',
        tipo: 'Boi',
        sexo: 'Macho',
        raca: 'Angus',
        peso: 610,
        valor: 11200,
        dataNascimento: '2020-11-05',
        status: 'Saudavel',
        observacoes: 'Animal pronto para negociacao no proximo lote.',
        fotoUrl: 'assets/img/bezerro-1.png',
        createdAt: '2026-03-09T10:00:00.000Z'
    },
    {
        id: 'a-1003',
        nome: 'Aurora',
        identificacao: 'BEZ-031',
        tipo: 'Bezerra',
        sexo: 'Femea',
        raca: 'Cruzado',
        peso: 128,
        valor: 3200,
        dataNascimento: '2025-12-12',
        status: 'Em observacao',
        observacoes: 'Acompanhamento nutricional semanal.',
        fotoUrl: 'assets/img/bezerro-2.png',
        createdAt: '2026-03-09T10:00:00.000Z'
    },
    {
        id: 'a-1004',
        nome: 'Brutus',
        identificacao: 'GAR-009',
        tipo: 'Garrote',
        sexo: 'Macho',
        raca: 'Nelore',
        peso: 295,
        valor: 5400,
        dataNascimento: '2024-06-02',
        status: 'Saudavel',
        observacoes: 'Boa evolucao de ganho de peso.',
        fotoUrl: 'assets/img/bezerro-1.png',
        createdAt: '2026-03-09T10:00:00.000Z'
    }
];

@Injectable({
    providedIn: 'root'
})
export class AnimalService {
    private readonly http = inject(HttpClient);
    private dataSourceMode: DataSourceMode = 'local';

    async list(): Promise<{ data: AnimalRecord[]; source: DataSourceMode }> {
        const animals = await this.readAnimals();
        return { data: animals, source: this.dataSourceMode };
    }

    async save(payload: AnimalRecord): Promise<{ data: AnimalRecord; source: DataSourceMode }> {
        const normalized = this.normalizeAnimal(payload);

        if (this.canUseJsonServer()) {
            try {
                const savedAnimal = normalized.id
                    ? await firstValueFrom(this.http.put<AnimalRecord>(`${this.getApiUrl()}/${normalized.id}`, normalized))
                    : await firstValueFrom(this.http.post<AnimalRecord>(this.getApiUrl(), normalized));

                this.dataSourceMode = 'json-server';
                return { data: this.normalizeAnimal(savedAnimal), source: this.dataSourceMode };
            } catch {
                const fallback = this.saveToLocal(normalized);
                return { data: fallback, source: this.dataSourceMode };
            }
        }

        const fallback = this.saveToLocal(normalized);
        return { data: fallback, source: this.dataSourceMode };
    }

    async remove(id: string): Promise<DataSourceMode> {
        if (this.canUseJsonServer()) {
            try {
                await firstValueFrom(this.http.delete<void>(`${this.getApiUrl()}/${id}`));
                this.dataSourceMode = 'json-server';
                return this.dataSourceMode;
            } catch {
                return this.removeFromLocal(id);
            }
        }

        return this.removeFromLocal(id);
    }

    getStats(animals: AnimalRecord[]): AnimalStats {
        return animals.reduce<AnimalStats>(
            (accumulator, animal) => {
                accumulator.total += 1;
                accumulator.valorTotal += animal.valor || 0;
                if (animal.sexo === 'Macho') {
                    accumulator.machos += 1;
                } else {
                    accumulator.femeas += 1;
                }
                return accumulator;
            },
            { total: 0, machos: 0, femeas: 0, valorTotal: 0 }
        );
    }

    private async readAnimals(): Promise<AnimalRecord[]> {
        if (this.canUseJsonServer()) {
            try {
                const animals = await firstValueFrom(this.http.get<AnimalRecord[]>(this.getApiUrl()));
                this.dataSourceMode = 'json-server';
                return animals.map((animal) => this.normalizeAnimal(animal));
            } catch {
                return this.readFromLocal();
            }
        }

        return this.readFromLocal();
    }

    private readFromLocal(): AnimalRecord[] {
        const rawAnimals = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (!rawAnimals) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seedAnimals));
            this.dataSourceMode = 'local';
            return [...seedAnimals];
        }

        this.dataSourceMode = 'local';
        return JSON.parse(rawAnimals).map((animal: AnimalRecord) => this.normalizeAnimal(animal));
    }

    private saveToLocal(payload: AnimalRecord): AnimalRecord {
        const animals = this.readFromLocal();
        const animalToSave = payload.id ? payload : { ...payload, id: this.createId(), createdAt: new Date().toISOString() };
        const existingIndex = animals.findIndex((animal) => animal.id === animalToSave.id);

        if (existingIndex >= 0) {
            animals[existingIndex] = animalToSave;
        } else {
            animals.unshift(animalToSave);
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animals));
        this.dataSourceMode = 'local';
        return animalToSave;
    }

    private removeFromLocal(id: string): DataSourceMode {
        const animals = this.readFromLocal().filter((animal) => animal.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(animals));
        this.dataSourceMode = 'local';
        return this.dataSourceMode;
    }

    private normalizeAnimal(animal: Partial<AnimalRecord>): AnimalRecord {
        return {
            id: animal.id || '',
            nome: animal.nome || '',
            identificacao: animal.identificacao || '',
            tipo: (animal.tipo as AnimalTipo) || 'Vaca',
            sexo: (animal.sexo as AnimalSexo) || 'Femea',
            raca: animal.raca || '',
            peso: Number(animal.peso || 0),
            valor: Number(animal.valor || 0),
            dataNascimento: animal.dataNascimento || new Date().toISOString().slice(0, 10),
            status: (animal.status as AnimalStatus) || 'Saudavel',
            observacoes: animal.observacoes || '',
            fotoUrl: animal.fotoUrl || FALLBACK_IMAGE,
            createdAt: animal.createdAt || new Date().toISOString()
        };
    }

    private canUseJsonServer(): boolean {
        return Boolean(this.getApiUrl());
    }

    private getApiUrl(): string {
        const hostname = globalThis.location?.hostname ?? '';
        const runtimeApiUrl = (globalThis as { __PEX_API_URL__?: string }).__PEX_API_URL__;

        if (runtimeApiUrl) {
            return `${runtimeApiUrl.replace(/\/$/, '')}/animals`;
        }

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${LOCAL_API_BASE_URL}/animals`;
        }

        return '';
    }

    private createId(): string {
        return `a-${Math.random().toString(36).slice(2, 9)}`;
    }
}
