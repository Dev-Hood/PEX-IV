import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import {
    ANIMAL_SEX_OPTIONS,
    ANIMAL_STATUS_OPTIONS,
    ANIMAL_TYPE_OPTIONS,
    AnimalRecord,
    AnimalService,
    AnimalStatus,
    AnimalTipo,
    DataSourceMode
} from '../service/animal.service';

@Component({
    selector: 'app-crud',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        InputNumberModule,
        DatePickerModule,
        TextareaModule,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        CurrencyPipe,
        DatePipe
    ],
    templateUrl: './crud.html',
    styleUrl: './crud.scss',
    providers: [MessageService, ConfirmationService]
})
export class Crud implements OnInit {
    private readonly formBuilder = inject(FormBuilder);
    private readonly animalService = inject(AnimalService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    readonly animals = signal<AnimalRecord[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly searchTerm = signal('');
    readonly selectedType = signal<'Todos' | AnimalTipo>('Todos');
    readonly dataSource = signal<DataSourceMode>('local');
    readonly editingId = signal<string | null>(null);

    readonly typeOptions = [{ label: 'Todos', value: 'Todos' as const }, ...ANIMAL_TYPE_OPTIONS];
    readonly animalTypeOptions = ANIMAL_TYPE_OPTIONS;
    readonly animalSexOptions = ANIMAL_SEX_OPTIONS;
    readonly animalStatusOptions = ANIMAL_STATUS_OPTIONS;
    readonly breedOptions = [
        { label: 'Nelore', value: 'Nelore' },
        { label: 'Angus', value: 'Angus' },
        { label: 'Cruzado', value: 'Cruzado' },
        { label: 'Girolando', value: 'Girolando' },
        { label: 'Tabapua', value: 'Tabapua' }
    ];

    readonly animalForm = this.formBuilder.nonNullable.group({
        id: [''],
        nome: ['', [Validators.required, Validators.minLength(2)]],
        identificacao: ['', [Validators.required, Validators.minLength(3)]],
        tipo: ['Vaca' as AnimalTipo, Validators.required],
        sexo: ['Femea', Validators.required],
        raca: ['Nelore', Validators.required],
        peso: [0, [Validators.required, Validators.min(1)]],
        valor: [0, [Validators.required, Validators.min(1)]],
        dataNascimento: [new Date(), Validators.required],
        status: ['Saudavel' as AnimalStatus, Validators.required],
        observacoes: [''],
        fotoUrl: ['assets/img/bezerro-1.png']
    });

    readonly stats = computed(() => this.animalService.getStats(this.animals()));

    readonly filteredAnimals = computed(() => {
        const term = this.searchTerm().trim().toLowerCase();
        const type = this.selectedType();

        return this.animals().filter((animal) => {
            const matchesType = type === 'Todos' || animal.tipo === type;
            const matchesTerm =
                !term ||
                animal.nome.toLowerCase().includes(term) ||
                animal.identificacao.toLowerCase().includes(term) ||
                animal.raca.toLowerCase().includes(term) ||
                animal.status.toLowerCase().includes(term);

            return matchesType && matchesTerm;
        });
    });

    get isEditing(): boolean {
        return Boolean(this.editingId());
    }

    get hasFormError(): boolean {
        return this.animalForm.invalid && this.animalForm.touched;
    }

    ngOnInit(): void {
        this.loadAnimals();
    }

    async loadAnimals(): Promise<void> {
        this.loading.set(true);

        try {
            const response = await this.animalService.list();
            this.animals.set(
                response.data.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
            );
            this.dataSource.set(response.source);
        } finally {
            this.loading.set(false);
        }
    }

    async submitForm(): Promise<void> {
        this.animalForm.markAllAsTouched();

        if (this.animalForm.invalid) {
            return;
        }

        const wasEditing = this.isEditing;
        this.saving.set(true);

        try {
            const formValue = this.animalForm.getRawValue();
            const payload: AnimalRecord = {
                id: formValue.id || undefined,
                nome: formValue.nome.trim(),
                identificacao: formValue.identificacao.trim().toUpperCase(),
                tipo: formValue.tipo as AnimalTipo,
                sexo: formValue.sexo as AnimalRecord['sexo'],
                raca: formValue.raca,
                peso: Number(formValue.peso),
                valor: Number(formValue.valor),
                dataNascimento: this.formatDateForApi(formValue.dataNascimento),
                status: formValue.status as AnimalStatus,
                observacoes: formValue.observacoes.trim(),
                fotoUrl: formValue.fotoUrl.trim() || 'assets/img/bezerro-1.png',
                createdAt: this.editingId()
                    ? this.animals().find((animal) => animal.id === this.editingId())?.createdAt || new Date().toISOString()
                    : new Date().toISOString()
            };

            const response = await this.animalService.save(payload);
            this.dataSource.set(response.source);
            await this.loadAnimals();
            this.resetForm();

            this.messageService.add({
                severity: 'success',
                summary: wasEditing ? 'Registro atualizado' : 'Registro criado',
                detail:
                    response.source === 'json-server'
                        ? 'Dados enviados para o json-server com sucesso.'
                        : 'Dados salvos localmente para manter o funcionamento na Vercel.',
                life: 3500
            });
        } finally {
            this.saving.set(false);
        }
    }

    editAnimal(animal: AnimalRecord): void {
        this.editingId.set(animal.id || null);
        this.animalForm.patchValue({
            id: animal.id || '',
            nome: animal.nome,
            identificacao: animal.identificacao,
            tipo: animal.tipo,
            sexo: animal.sexo,
            raca: animal.raca,
            peso: animal.peso,
            valor: animal.valor,
            dataNascimento: new Date(animal.dataNascimento),
            status: animal.status,
            observacoes: animal.observacoes,
            fotoUrl: animal.fotoUrl
        });
    }

    confirmDelete(animal: AnimalRecord): void {
        this.confirmationService.confirm({
            message: `Excluir ${animal.nome} (${animal.identificacao}) do rebanho?`,
            header: 'Confirmar exclusao',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Excluir',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: async () => {
                if (!animal.id) {
                    return;
                }

                const source = await this.animalService.remove(animal.id);
                this.dataSource.set(source);
                await this.loadAnimals();

                if (this.editingId() === animal.id) {
                    this.resetForm();
                }

                this.messageService.add({
                    severity: 'success',
                    summary: 'Registro removido',
                    detail:
                        source === 'json-server'
                            ? 'Animal excluido da API json-server.'
                            : 'Animal removido do armazenamento local.',
                    life: 3000
                });
            }
        });
    }

    resetForm(): void {
        this.editingId.set(null);
        this.animalForm.reset({
            id: '',
            nome: '',
            identificacao: '',
            tipo: 'Vaca',
            sexo: 'Femea',
            raca: 'Nelore',
            peso: 0,
            valor: 0,
            dataNascimento: new Date(),
            status: 'Saudavel',
            observacoes: '',
            fotoUrl: 'assets/img/bezerro-1.png'
        });
    }

    async handleFileInput(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        const imageAsBase64 = await this.readFileAsDataUrl(file);
        this.animalForm.patchValue({ fotoUrl: imageAsBase64 });
    }

    updateSearchFromEvent(event: Event): void {
        const value = (event.target as HTMLInputElement | null)?.value ?? '';
        this.updateSearch(value);
    }

    updateSearch(term: string): void {
        this.searchTerm.set(term);
    }

    updateTypeFilter(type: 'Todos' | AnimalTipo): void {
        this.selectedType.set(type);
    }

    getStatusSeverity(status: AnimalStatus): 'success' | 'warn' | 'danger' | 'info' {
        switch (status) {
            case 'Saudavel':
                return 'success';
            case 'Em observacao':
                return 'warn';
            case 'Vendido':
                return 'danger';
            default:
                return 'info';
        }
    }

    getSexoSeverity(sexo: string): 'success' | 'warn' {
        return sexo === 'Macho' ? 'success' : 'warn';
    }

    getSourceLabel(): string {
        return this.dataSource() === 'json-server' ? 'JSON Server ativo' : 'Modo local para Vercel';
    }

    private formatDateForApi(date: Date | string): string {
        if (date instanceof Date) {
            return date.toISOString().slice(0, 10);
        }

        return new Date(date).toISOString().slice(0, 10);
    }

    private readFileAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
}
