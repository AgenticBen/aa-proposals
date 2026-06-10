import { getAllClients } from "@/lib/data/clients";
import { NewDocumentForm } from "./_components/NewDocumentForm";
import { ClientsManager } from "./_components/ClientsManager";

export default async function ClientsPage() {
  const clients = await getAllClients();

  return (
    <div className="space-y-10">
      {/* New Document */}
      <div>
        <div className="mb-6">
          <h1 className="font-display text-3xl text-navy">New Document</h1>
          <p className="font-body text-sm text-charcoal/60 mt-1">
            Choose a client and give the proposal a title to get started.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-2xl">
          <NewDocumentForm clients={clients} />
        </div>
      </div>

      {/* Clients */}
      <div>
        <div className="mb-6">
          <h2 className="font-display text-2xl text-navy">Clients</h2>
          <p className="font-body text-sm text-charcoal/60 mt-1">
            Manage your client contacts.
          </p>
        </div>
        <ClientsManager initialClients={clients} />
      </div>
    </div>
  );
}
