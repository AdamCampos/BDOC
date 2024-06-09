package adam.cli.N1710;

import adam.cli.Diretorio;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.io.FileUtils;

public class Grupos {

    public static List<String> listaSaidaCSV = new ArrayList<>();
    private File arquivoOrigem;
    private File pastaDestino;
    private String sistemaDestino = "";
    private boolean mostraSaida = Diretorio.mostraSaida;
    private String g0_Language = ""; //Language
    private String g1_Category = ""; //Category
    private String g2_Facility = ""; //Facility 
    private String g3_Activity = ""; //Area of Activity
    private String g4_Service = ""; //Class of Service
    private String g5_Source = ""; //Source Code
    private String g6 = "";
    private String g7_Version = "";
    private String sigemA = "";
    private String sigemB = "";
    private String nomeOriginal = "";

    public Grupos(File arquivoOrigem, File diretorioDestino) {

        String csv = arquivoOrigem.getName() + ";";
        this.nomeOriginal = arquivoOrigem.getName();
        this.arquivoOrigem = arquivoOrigem;
        this.pastaDestino = diretorioDestino;

        String strPadrao1 = "([a-zA-Z])?[-]?"
                + "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                //                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})[_]([a-zA-Z0-9]?)";

        String strPadrao2 = "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})[_]([a-zA-Z0-9]?)";

        String strPadrao3 = "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})";

        String strPadrao4 = "([a-zA-Z])?[-]?"
                + "([a-zA-Z]{2})[-]"
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]"
                + "(\\d{4})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "([a-zA-Z0-9]{3})[-]"
                + "(\\d{3})";

        //Isométrico
        String strPadrao5 = "([a-zA-Z])?[-]" //I
                + "(IS)[-]" //IS
                + "(\\d{4}\\.[a-zA-Z0-9]{2})[-]" //3010.2J
                + "(\\d{4})[-]" //1421
                + "([a-zA-Z0-9]{3})[-]" //944
                + "([a-zA-Z0-9]{3})[-]" //KES
                + "(.*)[-]" //M10A-DA-0154
                + "([a-zA-Z0-9]{0,10})[_]([a-zA-Z0-9])"; //N6H_0

        //BRASFELS (Parei aqui... 15/04/2024)
        String strPadrao6 = "(B0021)" //B0021
                + "(.*)[-]" //ST-
                + "(.*)[-]" //CF-
                + "(\\d{4})[-]" //1414
                + "([a-zA-Z0-9]{3})[-]" //M04
                + "(\\d{3})[_]([a-zA-Z0-9]?)"; //001_0

        Pattern padraoPresente1 = Pattern.compile(strPadrao1);
        Matcher matcherPadrao1 = padraoPresente1.matcher(arquivoOrigem.getName());

        Pattern padraoPresente2 = Pattern.compile(strPadrao2);
        Matcher matcherPadrao2 = padraoPresente2.matcher(arquivoOrigem.getName());

        Pattern padraoPresente3 = Pattern.compile(strPadrao3);
        Matcher matcherPadrao3 = padraoPresente3.matcher(arquivoOrigem.getName());

        Pattern padraoPresente4 = Pattern.compile(strPadrao4);
        Matcher matcherPadrao4 = padraoPresente4.matcher(arquivoOrigem.getName());

        Pattern padraoPresente5 = Pattern.compile(strPadrao5);
        Matcher matcherPadrao5 = padraoPresente5.matcher(arquivoOrigem.getName());

        Pattern padraoPresente6 = Pattern.compile(strPadrao6);
        Matcher matcherPadrao6 = padraoPresente5.matcher(arquivoOrigem.getName());

        if (matcherPadrao1.find()) {

            if (mostraSaida) {
                System.out.println("Padrão 1");
            }

            if (matcherPadrao1.group(1) != null) {
                this.g0_Language = matcherPadrao1.group(1);
            }

            if (matcherPadrao1.group(2) != null) {
                this.g1_Category = matcherPadrao1.group(2);
            }

            if (matcherPadrao1.group(3) != null) {
                this.g2_Facility = matcherPadrao1.group(3);
            }

            if (matcherPadrao1.group(4) != null) {
                this.g3_Activity = matcherPadrao1.group(4);
            }

            if (matcherPadrao1.group(5) != null) {
                this.g4_Service = matcherPadrao1.group(5);
            }

            if (matcherPadrao1.group(6) != null) {
                this.g5_Source = matcherPadrao1.group(6);
            }

            if (matcherPadrao1.group(7) != null) {
                this.g6 = matcherPadrao1.group(7);
            }

            if (matcherPadrao1.group(8) != null) {
                this.g7_Version = matcherPadrao1.group(8);
            }

            //P-79 SIGEM
            //Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.[pdf|PDF]");
            //P-83 Integra
            Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.?[a-zA-Z]{0,3}");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = matcherPadraoRevisao.group(2);
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao2.find()) {

            if (mostraSaida) {
                System.out.println("Padrão 2");
            }

            this.g0_Language = "X";

            if (matcherPadrao2.group(1) != null) {
                this.g1_Category = matcherPadrao2.group(1);
            }

            if (matcherPadrao2.group(2) != null) {
                this.g2_Facility = matcherPadrao2.group(2);
            }

            if (matcherPadrao2.group(3) != null) {
                this.g3_Activity = matcherPadrao2.group(3);
            }

            if (matcherPadrao2.group(4) != null) {
                this.g4_Service = matcherPadrao2.group(4);
            }

            if (matcherPadrao2.group(5) != null) {
                this.g5_Source = matcherPadrao2.group(5);
            }

            if (matcherPadrao2.group(6) != null) {
                this.g6 = matcherPadrao2.group(6);
            }

            if (matcherPadrao2.group(7) != null) {
                this.g7_Version = matcherPadrao2.group(7);
            }

            Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.?[pdf|PDF]?");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = matcherPadraoRevisao.group(2);
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao3.find()) {

            if (mostraSaida) {
                System.out.println("Padrão 3");
            }

            this.g0_Language = "X";

            if (matcherPadrao3.group(1) != null) {
                this.g1_Category = matcherPadrao3.group(1);
            }

            if (matcherPadrao3.group(2) != null) {
                this.g2_Facility = matcherPadrao3.group(2);
            }

            if (matcherPadrao3.group(3) != null) {
                this.g3_Activity = matcherPadrao3.group(3);
            }

            if (matcherPadrao3.group(4) != null) {
                this.g4_Service = matcherPadrao3.group(4);
            }

            if (matcherPadrao3.group(5) != null) {
                this.g5_Source = matcherPadrao3.group(5);
            }

            if (matcherPadrao3.group(6) != null) {
                this.g6 = matcherPadrao3.group(6);
            }

            this.g7_Version = "1";

            Pattern padraoRevisao = Pattern.compile("(.*)\\.?[pdf|PDF]?");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = "0";
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao4.find()) {

            if (mostraSaida) {
                System.out.println("Padrão 4");
            }

            this.g0_Language = matcherPadrao1.group(1);

            if (matcherPadrao4.group(2) != null) {
                this.g1_Category = matcherPadrao4.group(2);
            }

            if (matcherPadrao4.group(3) != null) {
                this.g2_Facility = matcherPadrao4.group(3);
            }

            if (matcherPadrao4.group(4) != null) {
                this.g3_Activity = matcherPadrao4.group(4);
            }

            if (matcherPadrao4.group(5) != null) {
                this.g4_Service = matcherPadrao4.group(5);
            }

            if (matcherPadrao4.group(6) != null) {
                this.g5_Source = matcherPadrao4.group(6);
            }

            if (matcherPadrao4.group(7) != null) {
                this.g6 = matcherPadrao4.group(7);
            }

            this.g7_Version = "1";

            Pattern padraoRevisao = Pattern.compile("(.*)\\.?[pdf|PDF]?");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = "0";
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }
        } else if (matcherPadrao5.find()) {

            if (mostraSaida) {
                System.out.println("Padrão 5");
            }

            System.out.println("Arquivo " + arquivoOrigem.getName() + " fora da Norma.");

            if (matcherPadrao5.group(1) != null) {
                this.g0_Language = matcherPadrao5.group(1);
            }

            if (matcherPadrao5.group(2) != null) {
                this.g1_Category = matcherPadrao5.group(2);
            }

            if (matcherPadrao5.group(3) != null) {
                this.g2_Facility = matcherPadrao5.group(3);
            }

            if (matcherPadrao5.group(4) != null) {
                this.g3_Activity = matcherPadrao5.group(4);
            }

            if (matcherPadrao5.group(5) != null) {
                this.g4_Service = matcherPadrao5.group(5);
            }

            if (matcherPadrao5.group(6) != null) {
                this.g5_Source = matcherPadrao5.group(6);
            }

            if (matcherPadrao5.group(7) != null) {
                this.g6 = matcherPadrao5.group(7);
            }

            if (matcherPadrao5.group(8) != null) {
                this.g7_Version = matcherPadrao5.group(8);
            }

            //P-79 SIGEM
            //Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.[pdf|PDF]");
            //P-83 Integra
            Pattern padraoRevisao = Pattern.compile("(.*)[_]([a-zA-Z0-9]+)\\.?[a-zA-Z]{0,3}");
            Matcher matcherPadraoRevisao = padraoRevisao.matcher(arquivoOrigem.getName());

            if (matcherPadraoRevisao.find()) {
                this.sigemA = matcherPadraoRevisao.group(1);
                this.sigemB = matcherPadraoRevisao.group(2);
            } else {
                this.sigemA = arquivoOrigem.getName();
                this.sigemB = "0";
            }

        } else if (matcherPadrao6.find()) {
            if (mostraSaida) {
                System.out.println("Padrão 4");
            }
        }

        if (g0_Language.equals("")) {
            g0_Language = "?";
        }
        if (g1_Category.equals("")) {
            g1_Category = "?";
        }
        if (g2_Facility.equals("")) {
            g2_Facility = "?";
        }
        if (g3_Activity.equals("")) {
            g3_Activity = "?";
        }
        if (g4_Service.equals("")) {
            g4_Service = "?";
        }
        if (g5_Source.equals("")) {
            g5_Source = "?";
        }
        if (g6.equals("")) {
            g6 = "?";
        }
        if (g7_Version.equals("")) {
            g7_Version = "?";
        }

        csv += g0_Language + ";" + g1_Category + ";" + g2_Facility + ";" + g3_Activity + ";" + g4_Service + ";" + g5_Source + ";" + g6 + ";" + g7_Version + ";";

        if (sigemA.equals("")) {
            sigemA = "?";
        }

        if (sigemB.equals("")) {
            sigemB = "?";
        }

        sistemaDestino = this.procuraPastaDestino();

        if (sistemaDestino.equals("")) {
            sistemaDestino = "?";
        }

        csv += sigemA + ";" + sigemB + ";" + sistemaDestino + ";";

        String link = "";

        if (sistemaDestino.contains("NAO_CADASTRADO") || sistemaDestino.contains("?") || g1_Category.equals("?")) {
            csv += ";;;;";
        } else {
            link = "=HIPERLINK(\"" + pastaDestino + "\\" + sistemaDestino + "\\" + g1_Category + "\")";
            csv += pastaDestino + "\\" + sistemaDestino + "\\" + g1_Category + ";" + link;
        }

        csv += "\r\n";

        if (mostraSaida) {
//            System.out.println(nomeOriginal + "\nG0: " + g0 + "\nG1: " + g1 + "\nG2: " + g2 + "\nG3: " + g3 + "\nG4: " + g4 + "\nG5: " + g5 + "\nG6: " + g6 + "\nG7: " + g7
//                    + "\nSIGEM_A: " + sigemA + "\nSIGEM_B:" + sigemB + "\nSISTEMA: " + sistemaDestino + "\nLINK: " + link);
        }

        listaSaidaCSV.add(csv);
    }

    private String procuraPastaDestino() {

        //O retorno do método é o nome do sistema. Este nome é obtido da pasta de destino, quando existir.    
        //G1 representa a categoria, composto por 2 letras    
        //G3 representa a área ou atividade, composto por 4 dígitos
        //pastaExistente é o arquivo no diretório de destino
        //O loop é interrompido quando encontrado no destino a pasta com o sistema. Se o loop terminar sem encontrar o
        //sistema, pode ser que não haja a pasta ou a subpasta. Então o sistema tentará criar.
        for (File pastaExistente : pastaDestino.listFiles()) {

            //Testa se o diretório é do tipo 5125
            if (g1_Category.length() == 2 && g3_Activity.length() == 4 && pastaExistente.getName().startsWith(g3_Activity)) {

                //Cria um subdiretório do tipo LI
                //diretorioDestino será algo como 5125/LI
                File diretorioDestino = new File(pastaExistente.getAbsoluteFile() + "/" + g1_Category);

                System.out.println("Origem: " + arquivoOrigem.getName() + "  Destino: " + g3_Activity + "\\" + diretorioDestino.getName() + "\n");

                //Só copia o arquivo se as condições permitirem
                boolean copiar = this.testaVersao(arquivoOrigem, diretorioDestino);

                if (copiar) {

                    this.copia(arquivoOrigem, diretorioDestino);
                }
                return pastaExistente.getName();
            }

        }
        //Tenta criar a pasta do sistema não encontrado no destino.
        if (g3_Activity.length() == 4) {

            File diretorioPai = new File(pastaDestino.getAbsoluteFile() + "/" + g3_Activity);
            diretorioPai.mkdir();
            System.out.println("Criando diretório pai: " + diretorioPai.getAbsoluteFile());

            if (g1_Category.length() == 2) {

                File diretorioFilho = new File(diretorioPai.getAbsoluteFile() + "/" + g1_Category);
                //System.out.println("Novo diretório filho: " + diretorioFilho.getAbsoluteFile());
                diretorioFilho.mkdir();
                boolean copiar = this.testaVersao(arquivoOrigem, diretorioFilho.getAbsoluteFile());
                if (copiar) {
                    System.out.println(arquivoOrigem.getName() + " será copiado [1].");
                    this.copia(arquivoOrigem, diretorioFilho.getAbsoluteFile());
                }
            }
            return diretorioPai.getName();
        } else {

            System.out.println("Copiando " + arquivoOrigem.getName() + " para temporário: " + pastaDestino);
            File temp = new File(pastaDestino.getAbsoluteFile() + "/TEMP");

            System.out.println("TEMP: " + temp);

            boolean copiar = this.testaVersao(arquivoOrigem, temp);
            if (copiar) {
                System.out.println(arquivoOrigem.getName() + " será copiado.");
                this.copia(arquivoOrigem, temp);
            }
        }
        return "NAO_CADASTRADO";
    }

    //arquivoOrigem é o aqruivo vindo do loop externo
    //diretorioDestino será algo como 5125/LI
    private boolean testaVersao(File arquivoOrigem, File diretorioDestino) {

        //Tenta listar todos arquivos similares
        try {

            if (mostraSaida && diretorioDestino.listFiles() != null) {
                System.out.println("Numero de arquivos no destino: " + diretorioDestino.listFiles().length);
            }

            if (diretorioDestino.listFiles() != null && diretorioDestino.listFiles().length >= 0) {
                for (File arquivoDentroSubpasta : diretorioDestino.listFiles()) {

                    System.out.println("\t...Confrontando : " + arquivoDentroSubpasta.getName() + "\n\t................: " + arquivoOrigem.getName());

                    //Se os arquivos forem iguais (até a versão), retorna sem fazer nada.
                    if (arquivoDentroSubpasta.getName().equals(arquivoOrigem.getName())) {
                        System.out.println("\t...Confrontando : " + arquivoDentroSubpasta.getName() + "\n\t................: " + arquivoOrigem.getName());
                        System.out.println("==Arquivos iguais : " + arquivoOrigem.getName() + " | " + arquivoDentroSubpasta.getName());
                        return false;
                    }

                    //Daqui para frente há duas possibilidades: ou os arquivos são completamente diferentes ou tem só a versão diferente
                    //(.*)         -> Nome do aqruivo, sem a versão
                    //([a-zA-Z0])) -> Versão
                    //Atualizado em 08/06/2024 =>  String strPadrao = "((.*)_([a-zA-Z0]{1}).*)";
                    String strPadrao = "((.*)_([a-zA-Z0]{1,2}))";
                    Pattern padraoVersao = Pattern.compile(strPadrao);
                    Matcher matcherVersaoDentroSubpasta = padraoVersao.matcher(arquivoDentroSubpasta.getName());
                    Matcher matcherVersaoExterno = padraoVersao.matcher(arquivoOrigem.getName());

                    //Testa se ambos os arquivos possuem mesmos padrões
                    //O primeiro grupo é o nome do arquivo e o segundo é a versão
                    if (matcherVersaoExterno.find() && matcherVersaoDentroSubpasta.find()) {
                        //Existe agrupamento para ambos arquivos, o de origem e o do diretório
                        if (matcherVersaoExterno.group(1).equals(matcherVersaoDentroSubpasta.group(1))) {
                            //O nome dos arquivos é o mesmo
                            System.out.println("Nomes iguais, vamos testar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  a versão: " + matcherVersaoExterno.group(1));
                        }
                    }

//                    if (matcherVersaoExterno.find() && matcherVersaoDentroSubpasta.find()) {
//
//                        //Teste se os nomes são iguais. A única possibilidade de isto acontecer é se as versões forem diferentes
//                        if (matcherVersaoExterno.group(2).equals(matcherVersaoDentroSubpasta.group(2))) {
//
//                            if (mostraSaida) {
//                                System.out.println("<>Arquivos com nomes iguais : " + arquivoOrigem.getName() + " | " + arquivoDentroSubpasta.getName());
//                                //Mostra a versão de cada um
//                                System.out.println("\t\tmatcherVersaoDentro " + matcherVersaoDentroSubpasta.group(3));
//                                System.out.println("\t\tmatcherVersaoFora " + matcherVersaoExterno.group(3));
//                            }
//
//                            //Retorna um inteiro comparano o externo com o interno (existente)
//                            int comparacao = matcherVersaoExterno.group(3).compareToIgnoreCase(matcherVersaoDentroSubpasta.group(3));
//
//                            //Positivo é mais novo
//                            if (comparacao > 0) {
//                                if (mostraSaida) {
//                                    System.out.println("Resultado comparacao: " + comparacao + "  "
//                                            + matcherVersaoExterno.group(3) + " é mais novo que " + matcherVersaoDentroSubpasta.group(3));
////                                    arquivoDentroSubpasta.deleteOnExit();
//                                }
//
//                                if (mostraSaida) {
////                                    System.out.println("[1] Tentando deletar: " + arquivoOrigem);
//                                }
//
////                                arquivoDentroSubpasta.deleteOnExit();
//                                return true;
//                            } else if (comparacao < 0) {
//                                if (mostraSaida) {
//                                    System.out.println("Resultado comparacao: " + comparacao + "  "
//                                            + matcherVersaoExterno.group(3) + " é mais antigo que " + matcherVersaoDentroSubpasta.group(3));
//                                }
//
//                                if (mostraSaida) {
//                                    System.out.println("[2] Tentando deletar: " + arquivoDentroSubpasta.getName());
//                                }
//
//                                try {
////                                    arquivoDentroSubpasta.deleteOnExit();
//                                } catch (Exception erro) {
//                                    System.out.println("Erro ao deletar " + arquivoDentroSubpasta.getName() + " -> " + erro);
//                                }
//                                return false;
//                            }
//
//                        } else if (!matcherVersaoExterno.group(2).equals(matcherVersaoDentroSubpasta.group(2))) {
//                            if (mostraSaida) {
//                                System.out.println("Nomes diferentes");
//                            }
//
//                            if (mostraSaida) {
//                                System.out.println("[3] Tentando deletar: " + arquivoDentroSubpasta.getName());
//                            }
//
////                            arquivoDentroSubpasta.deleteOnExit();
//                            return true;
//                        }
//                    } 
                    else {
                        System.out.println("Falhou no teste para padrões " + arquivoOrigem);
                    }
                }
            } else {

//                if (mostraSaida) {
//                    System.out.println("[4] Tentando deletar: " + arquivoOrigem);
//                }
//                arquivoOrigem.deleteOnExit();
                return true;
            }

        } catch (Exception e) {
            System.out.println("Erro testa versão" + e);
            return false;
        }

        return false;
    }

    private void copia(File arquivoOrigem, File diretorioDestino) {

        File arquivoFinal = new File(diretorioDestino + "/" + arquivoOrigem.getName());
        System.out.println("\t\t***************************************\t\t");

        if (arquivoFinal.exists()) {
            ///System.out.println(arquivoFinal.getName() + " já existe.");
        } else {
            ///System.out.println(arquivoFinal.getName() + " será copiado.");
            try {
                System.out.println("Copiando origem: " + arquivoOrigem.getName());
                FileUtils.copyToDirectory(arquivoOrigem, diretorioDestino);

            } catch (IOException ex) {
                Logger.getLogger(Grupos.class
                        .getName()).log(Level.SEVERE, ex.getMessage(), ex);
            }
        }
    }
}
